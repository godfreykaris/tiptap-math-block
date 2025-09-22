// src/components/MathBlock.tsx
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import EditableMathField from "./EditableMathField";
import safeId from "../lib/safeId";
import { useLineContext } from "./LineContext";

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
  ({ initialExpressions = [""], onOrderChange }, ref) => {
    const { setLine } = useLineContext();

    // Build fields from initial expressions (fresh IDs each open is OK)
    const [fields, setFields] = useState<Field[]>(
      initialExpressions.map((latex) => ({ id: safeId(), latex }))
    );

    // Keep parent informed of render order
    useEffect(() => {
      onOrderChange?.(fields.map((f) => f.id));
    }, [fields, onOrderChange]);

    // ✅ Synchronously seed the parent's line map anytime fields array changes
    // (covers first mount, add/remove, and when initialExpressions rebuild fields)
    useEffect(() => {
      fields.forEach((f) => setLine(f.id, f.latex ?? ""));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields]);

    // Rebuild fields if prop changes (e.g., modal reopened with new content)
    useEffect(() => {
      const next = initialExpressions.map((latex) => ({ id: safeId(), latex }));
      setFields(next); // seeding happens in the fields-effect above
    }, [initialExpressions]);

    // Add a new blank field on Enter only when in modal
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        const isInModal = document
          .querySelector(".math-modal")
          ?.contains(e.target as Node);

        if (e.key === "Enter" && isInModal) {
          e.preventDefault();
          setFields((prev) => {
            const id = safeId();
            // seed parent immediately to avoid Save race
            setLine(id, "");
            return [...prev, { id, latex: "" }];
          });
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [setLine]);

    // Programmatic addLine (toolbar)
    useImperativeHandle(
      ref,
      () => ({
        addLine: (latex = "") => {
          const id = safeId();
          setLine(id, latex); // seed immediately
          setFields((prev) => [...prev, { id, latex }]);
        },
      }),
      [setLine]
    );

    const removeField = (id: string) => {
      setFields((prev) => {
        if (prev.length === 1) {
          // keep one field: just clear the remaining line
          const cleared = { ...prev[0], latex: "" };
          setLine(cleared.id, "");
          return [cleared];
        }
        // also clear the parent's entry for the removed id
        setLine(id, "");
        return prev.filter((f) => f.id !== id);
      });
    };

    return (
      <div className="flex flex-col items-center">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="w-full max-w-lg flex items-start gap-2 mb-2"
          >
            <div className="flex-1">
              {/* EditableMathField will keep pushing live edits; our eager seed above closes the initial race */}
              <EditableMathField initialLatex={field.latex} lineId={field.id} />
            </div>

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

MathBlock.displayName = "MathBlock";
export default MathBlock;
