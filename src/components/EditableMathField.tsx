// src/components/EditableMathField.tsx
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import 'mathquill/build/mathquill.css';
import { useLineContext } from './LineContext';

// ---- Minimal MathQuill typings ----
type MQEditHandler = () => void;

interface MQMathField {
  latex(): string;
  latex(value: string): void;
  focus(): void;
  write(value: string): void;

  mqUndoFn?: () => void;
  mqRedoFn?: () => void;
}

interface MQOptions {
  spaceBehavesLikeTab?: boolean;
  handlers?: {
    edit?: MQEditHandler;
  };
}

interface MQInterfaceV2 {
  MathField: (el: HTMLElement, opts?: MQOptions) => MQMathField;
}

interface MQGlobal {
  getInterface: (version: 2) => MQInterfaceV2;
}

declare global {
  interface Window {
    jQuery: typeof $;
    $: typeof $;
    MathQuill?: MQGlobal;
    activeMQField?: MQMathField;
    mqUndo?: () => void;
    mqRedo?: () => void;
  }
}

window.jQuery = $;
window.$ = $;

interface EditableMathFieldProps {
  initialLatex?: string;
  /** stable ID for this line (used by LineContext) */
  lineId: string;
}

const EditableMathField = ({
  initialLatex = '',
  lineId,
}: EditableMathFieldProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  const { setLine } = useLineContext();

  const historyRef = useRef<string[]>([]);
  const indexRef = useRef<number>(-1);
  const lastPushTsRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);

  const pushSnapshot = (latex: string, force = false) => {
    const now = Date.now();
    const last = historyRef.current[indexRef.current] ?? '';
    if (!force) {
      if (now - lastPushTsRef.current < 250) return;
      if (latex === last) return;
    }

    if (indexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    }

    historyRef.current.push(latex);
    indexRef.current = historyRef.current.length - 1;
    lastPushTsRef.current = now;

    // Clamp history length to avoid unbounded growth
    const MAX_HISTORY = 200;
    if (historyRef.current.length > MAX_HISTORY) {
      const drop = historyRef.current.length - MAX_HISTORY;
      historyRef.current.splice(0, drop);
      indexRef.current = historyRef.current.length - 1;
    }
  };

  const teardownRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mf: MQMathField | null = null;
    let container: HTMLSpanElement | null = null;
    let mounted = true;

    const attachUndoRedo = (mfInstance: MQMathField) => {
      const f = mfInstance; // avoid no-param-reassign
      f.mqUndoFn = () => {
        if (indexRef.current > 0) {
          indexRef.current -= 1;
          isRestoringRef.current = true;
          const prev = historyRef.current[indexRef.current];
          f.latex(prev);
          setLine(lineId, prev);
          isRestoringRef.current = false;
          f.focus();
        }
      };
      f.mqRedoFn = () => {
        if (indexRef.current < historyRef.current.length - 1) {
          indexRef.current += 1;
          isRestoringRef.current = true;
          const next = historyRef.current[indexRef.current];
          f.latex(next);
          setLine(lineId, next);
          isRestoringRef.current = false;
          f.focus();
        }
      };
    };

    import('mathquill/build/mathquill')
      .then(() => {
        if (mounted && window.MathQuill && spanRef.current) {
          const MQ = window.MathQuill.getInterface(2);
          mf = MQ.MathField(spanRef.current, {
            spaceBehavesLikeTab: true,
            handlers: {
              edit: () => {
                if (!mf || isRestoringRef.current) return;
                const latex = mf.latex();
                setLine(lineId, latex);
                pushSnapshot(latex);
              },
            },
          });

          // Seed initial state
          mf.latex(initialLatex);
          setLine(lineId, initialLatex);
          pushSnapshot(initialLatex, true);

          attachUndoRedo(mf);

          window.activeMQField = mf;
          container = spanRef.current;
          mf.focus();

          const setActive = () => {
            if (mf) window.activeMQField = mf;
          };

          container.addEventListener('focusin', setActive);
          container.addEventListener('mousedown', setActive);

          window.mqUndo = () => window.activeMQField?.mqUndoFn?.();
          window.mqRedo = () => window.activeMQField?.mqRedoFn?.();

          teardownRef.current = () => {
            container?.removeEventListener('focusin', setActive);
            container?.removeEventListener('mousedown', setActive);
          };
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
      teardownRef.current?.();
      if (window.activeMQField === mf) {
        delete window.activeMQField;
      }
    };
  }, [initialLatex, lineId, setLine]);

  return (
    <div className="flex justify-center">
      <span ref={spanRef} className="bg-zinc-50 text-black rounded" />
    </div>
  );
};

EditableMathField.displayName = 'EditableMathField';

EditableMathField.propTypes = {
  initialLatex: PropTypes.string,
};

export default EditableMathField;
