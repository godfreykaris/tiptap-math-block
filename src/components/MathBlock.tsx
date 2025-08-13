// src/components/MathBlock.tsx
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import EditableMathField from './EditableMathField';

interface MathBlockProps {
  /** One LaTeX expression per line */
  initialExpressions?: string[];
  /** Keep parent informed about current render order of line IDs */
  onOrderChange?: (ids: string[]) => void;
}

export interface MathBlockHandle {
  addLine: (latex?: string) => void;
}

interface Field {
  id: string;
  latex: string;
}

const MathBlock = forwardRef<MathBlockHandle, MathBlockProps>(
  ({ initialExpressions = [''], onOrderChange }, ref) => {
    // Track fields with unique IDs
    const [fields, setFields] = useState<Field[]>(
      initialExpressions.map((latex) => ({
        id: crypto.randomUUID(),
        latex,
      }))
    );

    // Tell parent the current order whenever it changes
    useEffect(() => {
      onOrderChange?.(fields.map((f) => f.id));
    }, [fields, onOrderChange]);

    // Add a new blank field on Enter only when in modal
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        const isInModal = document
          .querySelector('.math-modal')
          ?.contains(e.target as Node);

        if (e.key === 'Enter' && isInModal) {
          e.preventDefault();
          setFields((prev) => [
            ...prev,
            { id: crypto.randomUUID(), latex: '' },
          ]);
        }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }, []);

    // expose programmatic addLine for the toolbar button
    const addLine = (latex = '') => {
      setFields((prev) => [...prev, { id: crypto.randomUUID(), latex }]);
    };

    useImperativeHandle(ref, () => ({ addLine }), []);

    const removeField = (id: string) => {
      setFields((prev) => {
        if (prev.length === 1) {
          // keep one field: just clear the remaining line
          return [{ ...prev[0], latex: '' }];
        }
        return prev.filter((f) => f.id !== id);
      });
    };

    return (
      <div className="flex flex-col items-center">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="w-full max-w-lg flex items-start gap-2 mb-2 "
          >
            <div className="flex-1">
              <EditableMathField initialLatex={field.latex} lineId={field.id} />
            </div>

            {/* tiny remove button */}
            <button
              type="button"
              aria-label={`remove line ${idx + 1}`}
              data-testid="remove-line"
              className="px-2 py-1 text-sm rounded bg-red-100 hover:bg-red-200 text-red-700"
              onClick={() => removeField(field.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  }
);

MathBlock.displayName = 'MathBlock';
export default MathBlock;
