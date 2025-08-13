import React from 'react';

type Draft = {
  rows: number;
  cols: number;
  cells: string[][];
};

interface MathMiniEditorProps {
  isOpen: boolean;
  editingId: string | null;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  rowKeys: string[];
  colKeys: string[];
  ensureSize: (rows: number, cols: number, cells?: string[][]) => string[][];
  onCancel: () => void;
  onCommit: () => void;
}

const iconBtn =
  'inline-flex items-center justify-center h-9 px-3 rounded-xl ' +
  'border border-zinc-300/70 dark:border-zinc-700/70 ' +
  'bg-white text-black dark:bg-zinc-800 dark:text-white ' + // Solid bg + high contrast text
  'hover:bg-zinc-100 dark:hover:bg-zinc-700 ' +
  'text-sm font-medium shadow-sm transition focus:outline-none ' +
  'focus-visible:ring-4 focus-visible:ring-blue-500/25';

const primaryBtn =
  'inline-flex items-center justify-center h-9 px-4 rounded-xl ' +
  'bg-gradient-to-b from-blue-600 to-blue-700 text-white ' +
  'hover:from-blue-600 hover:to-blue-800 active:from-blue-700 active:to-blue-800 ' +
  'shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40';

const MathMiniEditor: React.FC<MathMiniEditorProps> = ({
  isOpen,
  editingId,
  draft,
  setDraft,
  rowKeys,
  colKeys,
  ensureSize,
  onCancel,
  onCommit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close matrix editor"
        className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/60 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="
          relative w-[min(92vw,640px)]
          overflow-hidden
          rounded-2xl border border-white/10 dark:border-white/5
          bg-white/85 dark:bg-zinc-900/80
          shadow-2xl ring-1 ring-black/5 backdrop-blur
        "
      >
        {/* Header */}
        <div className="relative isolate">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/15 via-indigo-500/10 to-fuchsia-500/15" />
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow">
                {/* matrix icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <rect
                    x="4"
                    y="4"
                    width="6"
                    height="6"
                    rx="1.5"
                    className="fill-current opacity-95"
                  />
                  <rect
                    x="14"
                    y="4"
                    width="6"
                    height="6"
                    rx="1.5"
                    className="fill-current opacity-80"
                  />
                  <rect
                    x="4"
                    y="14"
                    width="6"
                    height="6"
                    rx="1.5"
                    className="fill-current opacity-80"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="6"
                    height="6"
                    rx="1.5"
                    className="fill-current opacity-95"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-semibold leading-tight text-white">
                  {editingId ? 'Edit matrix' : 'New matrix'}
                </h4>
              </div>
            </div>
            <button
              type="button"
              className={iconBtn}
              onClick={onCancel}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {/* Size controls */}
          <div className="mb-4 flex justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Rows
              </div>
              <input
                type="number"
                min={1}
                max={10}
                value={draft.rows}
                onChange={(e) => {
                  const rows = Math.max(
                    1,
                    Math.min(10, Number(e.target.value) || 1)
                  );
                  setDraft((d) => ({
                    ...d,
                    rows,
                    cells: ensureSize(rows, d.cols, d.cells),
                  }));
                }}
                aria-label="Number of rows"
                className={
                  'w-20 text-center font-bold text-black bg-white ' +
                  'border border-zinc-300 rounded-md px-2 py-1 shadow-sm ' +
                  'outline-none transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                }
              />
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Columns
              </div>
              <input
                type="number"
                min={1}
                max={10}
                value={draft.cols}
                onChange={(e) => {
                  const cols = Math.max(
                    1,
                    Math.min(10, Number(e.target.value) || 1)
                  );
                  setDraft((d) => ({
                    ...d,
                    cols,
                    cells: ensureSize(d.rows, cols, d.cells),
                  }));
                }}
                aria-label="Number of columns"
                className={
                  'w-20 text-center font-bold text-black bg-white ' +
                  'border border-zinc-300 rounded-md px-2 py-1 shadow-sm ' +
                  'outline-none transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                }
              />
            </div>
          </div>

          {/* Cells grid */}
          <div className="overflow-auto rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-900/40 p-2 shadow-sm">
            <div className="flex justify-center">
              <table className="text-sm">
                <tbody>
                  {draft.cells.map((row, rIdx) => (
                    <tr key={rowKeys[rIdx]}>
                      {row.map((val, cIdx) => (
                        <td
                          key={`${rowKeys[rIdx]}-${colKeys[cIdx]}`}
                          className="p-1"
                        >
                          <input
                            value={val}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDraft((d) => {
                                const cells = d.cells.map((rr) => rr.slice());
                                cells[rIdx][cIdx] = v;
                                return { ...d, cells };
                              });
                            }}
                            className={
                              'w-16 text-center font-bold text-black bg-white ' +
                              'border border-zinc-300 rounded-md px-2 py-1 shadow-sm ' +
                              'outline-none transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                            }
                            placeholder={`a${rIdx + 1}${cIdx + 1}`}
                            aria-label={`Cell ${rIdx + 1}, ${cIdx + 1}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" className={iconBtn} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={primaryBtn} onClick={onCommit}>
              {editingId ? 'Update' : 'Insert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathMiniEditor;
