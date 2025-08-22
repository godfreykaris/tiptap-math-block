// src/extensions/MathInlineExtension.tsx
import React from 'react';
import { mergeAttributes, Node } from '@tiptap/core';
import type { NodeViewProps } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { v4 as uuidv4 } from 'uuid';

type MatrixRec = {
  id: string;
  label: string; // e.g. "M1"
  rows: number;
  cols: number;
  cells: string[][];
};

const PLACEHOLDER_RE = /⟦(M\d+)⟧/g;

const toBmatrix = (cells: string[][]) =>
  `\\begin{bmatrix}${cells.map((r) => r.join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;

function expandForDisplay(
  latexWithPlaceholders: string,
  matrices: Record<string, MatrixRec> | undefined | null
) {
  const byLabel: Record<string, MatrixRec> = {};
  if (matrices) {
    Object.values(matrices).forEach((rec) => {
      if (rec && rec.label) byLabel[rec.label] = rec;
    });
  }
  return (latexWithPlaceholders || '').replace(
    PLACEHOLDER_RE,
    (_m, label: string) => {
      const rec = byLabel[label];
      return rec ? toBmatrix(rec.cells) : `\\text{[missing ${label}]}`;
    }
  );
}

const MathInlineWrapper = ({ node, updateAttributes }: NodeViewProps) => {
  const latexWithPlaceholders = (node.attrs.latex as string) || '';
  const id = node.attrs.id as string;

  const matricesMap = React.useMemo(
    () => (node.attrs.matrices as Record<string, MatrixRec>) ?? {},
    [node.attrs.matrices]
  );

  const katexRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!katexRef.current) return;
    try {
      const expanded = expandForDisplay(latexWithPlaceholders, matricesMap);
      const src = expanded || '';
      katex.render(src, katexRef.current, {
        throwOnError: false,
        displayMode: false,
        strict: 'ignore',
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      if (katexRef.current) {
        katexRef.current.innerHTML = '<span>Error rendering LaTeX</span>';
      }
    }
  }, [latexWithPlaceholders, matricesMap]);

  const handleSave = (payload: {
    latex: string;
    matrices: Record<string, MatrixRec>;
  }) => {
    const { latex, matrices: nextMatrices } = payload;
    updateAttributes({ latex, matrices: nextMatrices, id });
  };

  const openModal = () => {
    window.dispatchEvent(
      new CustomEvent('openMathModal', {
        detail: {
          latex: latexWithPlaceholders,
          id,
          matrices: matricesMap,
          onSave: handleSave,
          mode: 'inline' as const,
        },
      })
    );
  };

  return (
    <NodeViewWrapper
      as="span"
      className="math-inline katex-container align-baseline"
      data-type="math-inline"
      data-id={id}
      title="Click to edit"
    >
      <button
        type="button"
        onClick={openModal}
        className="inline-block text-left focus:outline-none align-baseline"
        aria-label="Edit inline math"
      >
        <span ref={katexRef} className="katex-render align-baseline" />
        <span hidden className="raw-latex">
          {latexWithPlaceholders}
        </span>
      </button>
    </NodeViewWrapper>
  );
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathInline: {
      addMathInline: (attributes?: {
        latex?: string;
        id?: string;
        matrices?: Record<string, MatrixRec>;
      }) => ReturnType;
    };
  }
}

export const MathInlineExtension = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  whitespace: 'normal',

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-latex') || '',
        renderHTML: (attrs) => ({ 'data-latex': attrs.latex }),
      },
      matrices: {
        default: {},
        parseHTML: (el) => {
          const raw = el.getAttribute('data-matrices');
          if (!raw) return {};
          try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
          } catch {
            return {};
          }
        },
        renderHTML: (attrs) => ({
          'data-matrices': JSON.stringify(attrs.matrices || {}),
        }),
      },
      id: {
        default: () => uuidv4(),
        parseHTML: (el) => el.getAttribute('data-id') || uuidv4(),
        renderHTML: (attrs) => ({ 'data-id': attrs.id }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
        getAttrs: (el: HTMLElement) => ({
          latex: el.getAttribute('data-latex') || '',
          id: el.getAttribute('data-id') || uuidv4(),
          matrices: (() => {
            const raw = el.getAttribute('data-matrices');
            if (!raw) return {};
            try {
              const parsed = JSON.parse(raw);
              return parsed && typeof parsed === 'object' ? parsed : {};
            } catch {
              return {};
            }
          })(),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const latexWithPlaceholders = node.attrs.latex || '';
    const matrices = (node.attrs.matrices as Record<string, MatrixRec>) || {};

    let html = '';
    try {
      const expanded = expandForDisplay(latexWithPlaceholders, matrices);
      html = katex.renderToString(expanded || '', {
        throwOnError: false,
        displayMode: false,
        strict: 'ignore',
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      html = '<span>Error rendering LaTeX</span>';
    }

    return [
      'span',
      {
        'data-type': 'math-inline',
        'data-id': node.attrs.id,
        'data-latex': latexWithPlaceholders,
        'data-matrices': JSON.stringify(matrices || {}),
        class: 'math-inline katex-container align-baseline',
        ...mergeAttributes(HTMLAttributes),
      },
      [
        'span',
        { class: 'katex-render', dangerouslySetInnerHTML: { __html: html } },
      ],
      ['span', { hidden: true, class: 'raw-latex' }, latexWithPlaceholders],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineWrapper);
  },

  addCommands() {
    return {
      addMathInline:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              latex: attributes?.latex ?? 'x=\\square',
              matrices: attributes?.matrices ?? {},
              id: attributes?.id ?? uuidv4(),
              mode: 'inline' as const,
            },
          }),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-M': () => this.editor.commands.addMathInline(),
    };
  },
});

export default MathInlineExtension;
