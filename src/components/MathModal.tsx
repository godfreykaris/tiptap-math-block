// src/components/MathModal.tsx
import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import katex from "katex";
import MathBlock from "./MathBlock";
import MathToolbar from "./MathToolbar";
import type { MathBlockHandle } from "./MathBlock";
import MathMiniEditor from "./MathMiniEditor";
import { LineContext, type LineMap } from "./LineContext";
import "katex/dist/katex.min.css";

// Hoisted constants
const BR_SENTINEL = "\uE000";
const RE_RUN_BACKSLASH = /\\{2,}/g;
const RE_NEWLINE = /\r?\n/g;
// Accept both raw ⟦M1⟧ and wrapped \text{⟦M1⟧}
const PLACEHOLDER_RE = /(?<!\\)(?:\\text\{)?⟦(M\d+)⟧(?:\})?/g;

interface MathModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLatex: string;
  /** latex is kept with ⟦Mx⟧ placeholders; matrices carries the registry */
  onSave: (payload: {
    latex: string;
    matrices: Record<string, MatrixRec>;
  }) => void;
  id: string;
  /** seed matrices when opening the modal */
  initialMatrices?: Record<string, MatrixRec>;
}

type MatrixRec = {
  id: string;
  label: string; // M1, M2, ...
  rows: number;
  cols: number;
  cells: string[][];
};

// Safe KaTeX renderer (no dangerouslySetInnerHTML)
const KaTeXBlock: React.FC<{ latex: string; aria?: string }> = ({
  latex,
  aria,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      katex.render(latex, ref.current, { throwOnError: false });
    }
  }, [latex]);
  return (
    <div ref={ref} className="katex" role="img" aria-label={aria ?? "math"} />
  );
};

const toBmatrix = (cells: string[][]) =>
  `\\begin{bmatrix} ${cells
    .map((r) => r.join(" & "))
    .join(" \\\\ ")} \\end{bmatrix}`;

const ensureSize = (rows: number, cols: number, cells?: string[][]) =>
  Array.from({ length: rows }, (_r, rIdx) =>
    Array.from({ length: cols }, (_c, cIdx) => cells?.[rIdx]?.[cIdx] ?? "")
  );

const MathModal: React.FC<MathModalProps> = ({
  isOpen,
  onClose,
  initialLatex,
  onSave,
  id,
  initialMatrices,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [hasActiveEditor, setHasActiveEditor] = useState(false);

  // reflect when any MathQuill field becomes active
  useEffect(() => {
    const update = () => setHasActiveEditor(Boolean(window.activeMQField));
    document.addEventListener("focusin", update);
    update();
    return () => document.removeEventListener("focusin", update);
  }, []);

  const splitLines = useMemo(() => {
    if (!initialLatex) return [""];
    const normalized = initialLatex
      .replace(
        RE_RUN_BACKSLASH,
        (m) => BR_SENTINEL + (m.length % 2 ? "\\" : "")
      )
      .replace(RE_NEWLINE, BR_SENTINEL);
    return normalized.split(BR_SENTINEL);
  }, [initialLatex]);

  // ----- Line map (source of truth for all fields) -----
  const [lines, setLines] = useState<LineMap>({});
  const [lineOrder, setLineOrder] = useState<string[]>([]); // latest order from MathBlock

  const setLine = useCallback((idS: string, latex: string) => {
    setLines((prev) =>
      prev[idS] === latex ? prev : { ...prev, [idS]: latex }
    );
  }, []);

  const lineCtxValue = useMemo(
    () => ({ setLine, getAll: () => lines }),
    [setLine, lines]
  );

  // Matrices state
  const [matrices, setMatrices] = useState<Record<string, MatrixRec>>({});
  const [labelToId, setLabelToId] = useState<Record<string, string>>({});
  const [nextMatrixIndex, setNextMatrixIndex] = useState(1);

  // Track which labels are used (derived from line map)
  const usedLabels = useMemo(() => {
    const used = new Set<string>();
    Object.values(lines).forEach((line) => {
      line.replace(PLACEHOLDER_RE, (_m: string, labelStr: string) => {
        used.add(labelStr);
        return _m;
      });
    });
    return used;
  }, [lines]);

  // when the modal opens, seed state from props.initialMatrices
  useEffect(() => {
    if (!isOpen) return;
    const seed = initialMatrices ?? {};
    setMatrices(seed);
    setLabelToId(
      Object.values(seed).reduce<Record<string, string>>((acc, rec) => {
        acc[rec.label] = rec.id;
        return acc;
      }, {})
    );
    const maxIdx =
      Object.values(seed)
        .map((r) => Number(r.label.replace(/^M/, "")) || 0)
        .reduce((a, b) => Math.max(a, b), 0) || 0;
    setNextMatrixIndex(Math.max(1, maxIdx + 1));

    // Clear old lines when reopening modal
    setLines({});
    setLineOrder([]);
  }, [isOpen, initialMatrices]);

  // Editor modal state
  const [isMatrixEditorOpen, setMatrixEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    rows: number;
    cols: number;
    cells: string[][];
  }>({
    rows: 2,
    cols: 2,
    cells: [
      ["", ""],
      ["", ""],
    ],
  });

  // Stable keys for rows/cols (avoid array index keys)
  const [rowKeys, setRowKeys] = useState<string[]>(["r0", "r1"]);
  const [colKeys, setColKeys] = useState<string[]>(["c0", "c1"]);

  useEffect(() => {
    setRowKeys((prev) =>
      draft.rows > prev.length
        ? [
            ...prev,
            ...Array.from({ length: draft.rows - prev.length }, () =>
              crypto.randomUUID()
            ),
          ]
        : prev.slice(0, draft.rows)
    );
  }, [draft.rows]);

  useEffect(() => {
    setColKeys((prev) =>
      draft.cols > prev.length
        ? [
            ...prev,
            ...Array.from({ length: draft.cols - prev.length }, () =>
              crypto.randomUUID()
            ),
          ]
        : prev.slice(0, draft.cols)
    );
  }, [draft.cols]);

  // Keep track of the field that was active when user clicked the toolbar button
  const lastActiveFieldRef = useRef<Window["activeMQField"] | null>(null);

  const handleStartInsertMatrix = useCallback(
    (preset?: { rows: number; cols: number }) => {
      // remember where to insert after the mini-editor closes
      lastActiveFieldRef.current = window.activeMQField ?? null;

      const r = preset?.rows ?? 2;
      const c = preset?.cols ?? 2;
      setDraft({ rows: r, cols: c, cells: ensureSize(r, c) });
      setEditingId(null);
      setMatrixEditorOpen(true);
    },
    []
  );

  const openEditorByLabel = useCallback(
    (label: string) => {
      const matrixId = labelToId[label];
      if (!matrixId) return;
      const rec = matrices[matrixId];
      setDraft({
        rows: rec.rows,
        cols: rec.cols,
        cells: rec.cells.map((row) => row.slice()),
      });
      setEditingId(matrixId);
      setMatrixEditorOpen(true);
    },
    [labelToId, matrices]
  );

  const commitMatrix = useCallback(() => {
    const matrixId = editingId ?? crypto.randomUUID();

    // Determine label: if new, use nextMatrixIndex; if editing, keep existing
    let label: string;
    if (!editingId) {
      label = `M${nextMatrixIndex}`;
      setNextMatrixIndex((n) => n + 1);
    } else {
      label = matrices[matrixId].label;
    }

    const rec: MatrixRec = {
      id: matrixId,
      label,
      rows: draft.rows,
      cols: draft.cols,
      cells: ensureSize(draft.rows, draft.cols, draft.cells),
    };

    setMatrices((prev) => ({ ...prev, [matrixId]: rec }));
    setLabelToId((prev) => ({ ...prev, [label]: matrixId }));
    setMatrixEditorOpen(false);

    // insert placeholder only when NEW, at the exact caret where user started
    if (!editingId) {
      const target = lastActiveFieldRef.current ?? window.activeMQField;
      try {
        target?.focus();
        // raw placeholder works; regex accepts both raw and \text-wrapped
        target?.write(`⟦${label}⟧`);
      } finally {
        lastActiveFieldRef.current = null;
      }
    }
  }, [
    draft.rows,
    draft.cols,
    draft.cells,
    editingId,
    matrices,
    nextMatrixIndex,
  ]);

  const handleSave = useCallback(() => {
    // Assemble lines in the exact render order reported by MathBlock
    const finalLatexWithPlaceholders = lineOrder
      .map((idx) => lines[idx] ?? "")
      .join("\\\\");

    // Save only matrices whose labels are currently used
    const used = new Set<string>();
    Object.values(lines).forEach((line) => {
      line.replace(PLACEHOLDER_RE, (_m: string, labelStr: string) => {
        used.add(labelStr);
        return _m;
      });
    });

    const filteredMatrices = Object.values(matrices)
      .filter((m) => used.has(m.label))
      .reduce<Record<string, MatrixRec>>((acc, m) => {
        acc[m.id] = m;
        return acc;
      }, {});

    onSave({ latex: finalLatexWithPlaceholders, matrices: filteredMatrices });
    onClose();
  }, [lineOrder, lines, matrices, onClose, onSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // ref to call MathBlock.addLine()
  const blockRef = useRef<MathBlockHandle>(null);

  // Platform label (not a hook)
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform);
  const modKeyLabel = isMac ? "⌘" : "Ctrl";

  // Undo / Redo — they act on the CURRENT active field
  const handleUndo = useCallback(() => {
    const mf = window.activeMQField;
    if (!mf) return;
    mf.focus();
    window.mqUndo?.();
  }, []);

  const handleRedo = useCallback(() => {
    const mf = window.activeMQField;
    if (!mf) return;
    mf.focus();
    window.mqRedo?.();
  }, []);

  // Keyboard: Undo/Redo (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, and Ctrl/Cmd+Y)
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Only handle if the event originated inside this modal
      const inModal = modalRef.current?.contains(e.target as Node);
      if (!inModal) return;

      const meta = e.ctrlKey || e.metaKey; // Ctrl on Win/Linux, Cmd on macOS
      if (!meta) return;

      const key = e.key.toLowerCase();

      // Undo: Ctrl/Cmd+Z
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        window.activeMQField?.focus();
        window.mqUndo?.();
        return;
      }

      // Redo: Ctrl/Cmd+Shift+Z
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        window.activeMQField?.focus();
        window.mqRedo?.();
        return;
      }

      // Redo (Windows-style): Ctrl/Cmd+Y
      if (key === "y") {
        e.preventDefault();
        window.activeMQField?.focus();
        window.mqRedo?.();
      }
    };

    document.addEventListener("keydown", onKeydown, true);
    return () => {
      document.removeEventListener("keydown", onKeydown, true);
    };
  }, [isOpen]);

  // Important: do NOT place hooks after this line.
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 dark"
      aria-labelledby="math-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop as focusable, keyboard-closable control */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-default"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClose();
          }
        }}
        tabIndex={0}
      />

      {/* Dialog panel */}
      <div
        ref={modalRef}
        data-id={id}
        className="
          math-modal relative
          w-full sm:w-[92vw] md:w-[88vw] lg:w-[64rem]
          max-w-full
          h-[min(92dvh,900px)]
          bg-gray-50 dark:bg-gray-900 text-zinc-900 dark:text-zinc-100
          rounded-none sm:rounded-2xl shadow-2xl ring-1 ring-black/5
          animate-in fade-in zoom-in duration-150
          overflow-hidden flex flex-col
        "
      >
        {/* Header */}
        <div className="shrink-0 sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 backdrop-blur">
          <div className="min-w-0">
            <h2
              id="math-modal-title"
              className="text-lg sm:text-xl font-semibold tracking-tight"
            >
              Edit Math
            </h2>
          </div>

          {/* Undo / Redo / Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!hasActiveEditor}
              title={`Undo (${modKeyLabel}+Z)`}
              aria-label="Undo"
              className="inline-flex items-center gap-2 h-9 px-2 sm:px-3 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {/* icon omitted for brevity */}
              <span className="hidden sm:inline text-sm font-medium">Undo</span>
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={!hasActiveEditor}
              title={`Redo (Shift+${modKeyLabel}+Z)`}
              aria-label="Redo"
              className="inline-flex items-center gap-2 h-9 px-2 sm:px-3 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="hidden sm:inline text-sm font-medium">Redo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 h-9 px-2 sm:px-3 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            >
              X <span className="text-lg leading-none">Close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Sticky toolbar + New line */}
          <div className="sticky top-0 z-20 border-b border-zinc-200/70 dark:border-zinc-800/80">
            <div className="px-4 sm:px-6 py-2 bg-zinc-50/90 dark:bg-zinc-900/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/60">
              <MathToolbar onStartInsertMatrix={handleStartInsertMatrix} />
            </div>
            <div className="px-4 sm:px-6 py-2 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => blockRef.current?.addLine()}
                  className="h-8 px-3 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 
                     bg-white/70 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-700 
                     text-sm font-medium shadow-sm"
                  aria-label="Add new line"
                >
                  New line
                </button>
              </div>
            </div>
          </div>

          {/* Two-column content */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 pr-1 custom-scroll">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* LEFT: matrices preview */}
              <aside className="md:col-span-1 space-y-3">
                <h3 className="text-sm font-semibold">Matrices</h3>
                {Object.values(matrices).filter((m) => usedLabels.has(m.label))
                  .length === 0 && (
                  <>
                    <p className="text-sm text-zinc-500">
                      Added matrices will appear here.
                    </p>
                    <p className="text-sm text-zinc-500">No matrices yet.</p>
                  </>
                )}
                <ul className="space-y-2">
                  {Object.values(matrices)
                    .filter((m) => usedLabels.has(m.label))
                    .map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => openEditorByLabel(m.label)}
                          className="w-full text-left p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                          title={`Edit ${m.label}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {m.label}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {m.rows}×{m.cols}
                            </span>
                          </div>
                          <KaTeXBlock
                            latex={toBmatrix(m.cells)}
                            aria={`${m.label}`}
                          />
                        </button>
                      </li>
                    ))}
                </ul>
              </aside>

              {/* RIGHT: Math fields */}
              <div className="md:col-span-2">
                <LineContext.Provider value={lineCtxValue}>
                  <MathBlock
                    initialExpressions={splitLines}
                    ref={blockRef}
                    onOrderChange={setLineOrder}
                  />
                </LineContext.Provider>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 sticky bottom-0 z-30 flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition"
          >
            Save
          </button>
        </div>
      </div>

      {/* Mini Matrix Editor */}
      <MathMiniEditor
        isOpen={isMatrixEditorOpen}
        editingId={editingId}
        draft={draft}
        setDraft={setDraft}
        rowKeys={rowKeys}
        colKeys={colKeys}
        ensureSize={ensureSize}
        onCancel={() => {
          lastActiveFieldRef.current = null;
          setMatrixEditorOpen(false);
        }}
        onCommit={commitMatrix}
      />
    </div>
  );
};

MathModal.displayName = "MathModal";
export default MathModal;
