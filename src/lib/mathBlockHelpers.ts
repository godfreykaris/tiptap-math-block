// src/lib/mathBlockHelpers.ts
import type { Editor } from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { Node as PMNode } from '@tiptap/pm/model';

/**
 * Insert a new math block without overwriting a selected math block,
 * and seed it with some initial placeholder LaTeX.
 */
export default function addMathBlockAfterSelection(
  editor: Editor,
  initialLatex = 'x = \\square'
): boolean {
  if (!editor) return false;

  const { state, view } = editor;
  const { selection } = state;

  if (selection instanceof NodeSelection) {
    const selected: PMNode = selection.node;
    if (selected?.type?.name === 'mathBlock') {
      const posAfter = selection.$to.pos;
      const tr = state.tr.setSelection(
        TextSelection.create(state.doc, posAfter)
      );
      view.dispatch(tr);
    }
  }

  return editor
    .chain()
    .focus()
    .addMathBlock({
      latex: initialLatex,
    })
    .run();
}
