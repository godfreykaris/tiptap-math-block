// src/extensions/MathExtension.tsx
import React from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { v4 as uuidv4 } from "uuid";

// ---------- Types & helpers ----------
type MatrixRec = {
  id: string;
  label: string; // e.g. "M1"
  rows: number;
  cols: number;
  cells: string[][];
};

const PLACEHOLDER_RE = /⟦(M\d+)⟧/g;

const toBmatrix = (cells: string[][]) =>
  `\\begin{bmatrix}${cells
    .map((r) => r.join(" & "))
    .join(" \\\\ ")}\\end{bmatrix}`;

function expandForDisplay(
  latexWithPlaceholders: string,
  matrices: Record<string, MatrixRec> | undefined | null
) {
  const byLabel: Record<string, MatrixRec> = {};
  if (matrices) {
    if (matrices) {
      Object.values(matrices).forEach((rec) => {
        if (rec && rec.label) byLabel[rec.label] = rec;
      });
    }
  }

  return (latexWithPlaceholders || "").replace(
    PLACEHOLDER_RE,
    (_m, label: string) => {
      const rec = byLabel[label];
      return rec ? toBmatrix(rec.cells) : `\\text{[missing ${label}]}`;
    }
  );
}

// ---------- React NodeView ----------
const MathBlockWrapper = ({ node, updateAttributes }: NodeViewProps) => {
  const latexWithPlaceholders = (node.attrs.latex as string) || "";
  const id = node.attrs.id as string;
  const alignment =
    (node.attrs.alignment as "left" | "center" | "right") || "left";

  // Memoize matrices object to keep stable deps & avoid re-creating each render
  const matricesMap = React.useMemo(
    () => (node.attrs.matrices as Record<string, MatrixRec>) ?? {},
    [node.attrs.matrices]
  );

  const katexRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!katexRef.current) return;
    try {
      const expanded = expandForDisplay(latexWithPlaceholders, matricesMap);
      const alignedSrc = expanded
        ? `\\begin{gathered}${expanded}\\end{gathered}`
        : "";
      katex.render(alignedSrc, katexRef.current, {
        throwOnError: false,
        displayMode: true,
        strict: "ignore",
      });
    } catch (e) {
      console.error("KaTeX rendering error:", e);
      if (katexRef.current) {
        katexRef.current.innerHTML = "<span>Error rendering LaTeX</span>";
      }
    }
  }, [latexWithPlaceholders, matricesMap]);

  // Avoid shadowing "matrices" by renaming destructured field
  const handleSave = (payload: {
    latex: string;
    matrices: Record<string, MatrixRec>;
  }) => {
    const { latex, matrices: nextMatrices } = payload;
    updateAttributes({ latex, matrices: nextMatrices, id, alignment });
  };

  const openModal = () => {
    window.dispatchEvent(
      new CustomEvent("openMathModal", {
        detail: {
          latex: latexWithPlaceholders,
          id,
          matrices: matricesMap,
          onSave: handleSave,
        },
      })
    );
  };

  return (
    <NodeViewWrapper
      className={`math-block inline-block prose-lg katex-container align-${alignment}`}
      data-type="math-block"
      data-id={id}
      data-alignment={alignment}
      title="Click to edit"
    >
      <button
        type="button"
        onClick={openModal}
        className="block w-full text-left focus:outline-none"
        aria-label="Edit math block"
      >
        <div ref={katexRef} className="katex-render" />
        {/* keep raw latex (placeholders) for debugging/export if needed */}
        <p hidden className="raw-latex">
          {latexWithPlaceholders}
        </p>
      </button>
    </NodeViewWrapper>
  );
};

// ---------- Extension ----------
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      addMathBlock: (attributes?: {
        latex?: string;
        id?: string;
        alignment?: "left" | "center" | "right";
        matrices?: Record<string, MatrixRec>;
      }) => ReturnType;
      setMathBlockAlignment: (
        alignment: "left" | "center" | "right"
      ) => ReturnType;
    };
  }
}

export const MathExtension = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
        renderHTML: (attributes) => ({ "data-latex": attributes.latex }),
      },
      matrices: {
        default: {},
        parseHTML: (element) => {
          const raw = element.getAttribute("data-matrices");
          if (!raw) return {};
          try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
          } catch {
            return {};
          }
        },
        renderHTML: (attributes) => ({
          "data-matrices": JSON.stringify(attributes.matrices || {}),
        }),
      },
      id: {
        default: () => uuidv4(),
        parseHTML: (element) => element.getAttribute("data-id") || uuidv4(),
        renderHTML: (attributes) => ({ "data-id": attributes.id }),
      },
      alignment: {
        default: "left",
        parseHTML: (element) =>
          element.getAttribute("data-alignment") || "left",
        renderHTML: (attributes) => ({
          "data-alignment": attributes.alignment,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
        getAttrs: (element: HTMLElement) => ({
          latex: element.getAttribute("data-latex") || "",
          id: element.getAttribute("data-id") || uuidv4(),
          alignment: element.getAttribute("data-alignment") || "left",
          matrices: (() => {
            const raw = element.getAttribute("data-matrices");
            if (!raw) return {};
            try {
              const parsed = JSON.parse(raw);
              return parsed && typeof parsed === "object" ? parsed : {};
            } catch {
              return {};
            }
          })(),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const latexWithPlaceholders = node.attrs.latex || "";
    const alignment = node.attrs.alignment || "left";
    const matrices = (node.attrs.matrices as Record<string, MatrixRec>) || {};

    let html = "";
    try {
      const expanded = expandForDisplay(latexWithPlaceholders, matrices);
      const alignedSrc = expanded
        ? `\\begin{gathered}${expanded}\\end{gathered}`
        : "";
      html = katex.renderToString(alignedSrc, {
        throwOnError: false,
        displayMode: true,
        strict: "ignore",
      });
    } catch (e) {
      console.error("KaTeX rendering error:", e);
      html = "<span>Error rendering LaTeX</span>";
    }

    return [
      "div",
      {
        "data-type": "math-block",
        "data-id": node.attrs.id,
        "data-alignment": alignment,
        "data-latex": latexWithPlaceholders,
        "data-matrices": JSON.stringify(matrices || {}),
        class: `math-block inline-block prose-lg katex-container align-${alignment}`,
        ...mergeAttributes(HTMLAttributes),
      },
      [
        "div",
        { class: "katex-render", dangerouslySetInnerHTML: { __html: html } },
      ],
      ["p", { hidden: true, class: "raw-latex" }, latexWithPlaceholders],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockWrapper);
  },

  addCommands() {
    return {
      addMathBlock:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              latex: attributes?.latex ?? "",
              matrices: attributes?.matrices ?? {},
              id: attributes?.id ?? uuidv4(),
              alignment: attributes?.alignment ?? "left",
            },
          }),

      setMathBlockAlignment:
        (alignment: "left" | "center" | "right") =>
        ({ state, dispatch }) => {
          if (!dispatch) return false;
          const { selection } = state;
          const { pos } = selection.$from;
          const node = state.doc.nodeAt(pos);
          if (node && node.type.name === this.name) {
            dispatch(
              state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                alignment,
              })
            );
            return true;
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return { "Mod-Shift-M": () => this.editor.commands.addMathBlock() };
  },
});

export default MathExtension;
