// src/lib/mathBlockHelpers.ts
import type { Editor } from "@tiptap/core";
import { NodeSelection, TextSelection, Selection } from "@tiptap/pm/state";
import type { ResolvedPos } from "@tiptap/pm/model";

/**
 * Insert a math block on the "next line" after the current block,
 * regardless of current selection type (text, node, inside inline content, etc.).
 * Falls back gracefully at document boundaries.
 */
export default function addMathBlockOnNextLine(
  editor: Editor,
  initialLatex = "x = \\square",
  { ensureSpacerParagraph = false }: { ensureSpacerParagraph?: boolean } = {}
): boolean {
  if (!editor) return false;

  const { state, view } = editor;
  const { selection } = state;

  // Base position: for NodeSelection use the end ($to), otherwise caret start ($from).
  const $base: ResolvedPos =
    selection instanceof NodeSelection ? selection.$to : selection.$from;

  // Find the nearest ancestor that is a *block* and not the top-level doc.
  // We prefer the nearest textblock; if none, stop at depth 1 (top-level block).
  let { depth } = $base;
  while (depth > 1 && !$base.node(depth).isTextblock) {
    depth -= 1;
  }
  if (depth === 0) {
    // Safety: never use depth 0 with `after()`
    depth = 1;
  }

  // Compute a doc position just *after* that block node.
  let posAfterBlock: number;
  try {
    posAfterBlock = $base.after(depth); // depth >= 1 here
  } catch {
    // At the very end of the document or invalid depth; clamp near doc end.
    posAfterBlock = Math.max(1, state.doc.content.size - 1);
  }

  // Move selection near that position (bias +1 = forward)
  const $near = state.doc.resolve(
    Math.min(posAfterBlock, state.doc.content.size - 1)
  );
  const sel = Selection.near($near, 1);

  let tr = state.tr.setSelection(sel).scrollIntoView();

  // Optional: insert a spacer paragraph BEFORE the math block
  // (helps if we're between non-textblocks and want a clear "next line")
  if (ensureSpacerParagraph) {
    tr = tr.insert(
      tr.selection.from,
      state.schema.nodes.paragraph!.createAndFill()!
    );
    // Put the cursor after that new paragraph
    const afterPara = tr.selection.from + 1; // inside paragraph
    tr = tr.setSelection(TextSelection.near(tr.doc.resolve(afterPara), 1));
  }

  view.dispatch(tr);

  // Finally, insert the math block at the current selection
  return editor.chain().focus().addMathBlock({ latex: initialLatex }).run();
}
