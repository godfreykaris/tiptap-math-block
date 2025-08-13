# Tiptap Math Block Extension

A ready-to-use **Tiptap extension** and **React components** for editing LaTeX math blocks with a modal editor, KaTeX rendering, and matrix editing support.

## Features

- ✏️ **Inline and block math editing** with [KaTeX](https://katex.org/) rendering.
- 🧮 **Matrix editor** with visual previews and `⟦M1⟧` placeholders.
- 🔄 **Undo/Redo** support inside the modal (`Ctrl/Cmd+Z` and `Shift+Ctrl/Cmd+Z`).
- 🧹 **Helper function** to safely insert new math blocks without overwriting the selected one.
- 🔌 **Bridge hook** that wires the extension to the modal with zero boilerplate.
- 📦 Works with **Tiptap 2 + React**.

---

## Installation

```bash
npm install @godfreykaris/tiptap-math-block
# or
yarn add @godfreykaris/tiptap-math-block
```

Peer dependencies (make sure you have them installed):

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm katex react react-dom
```

---

## Quick Start

### 1) Import the extension, modal, helpers, and styles

```tsx
import "katex/dist/katex.min.css"; // Required for KaTeX rendering
import "@godfreykaris/tiptap-math-block/style.css"; // Required package styles

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import {
  MathExtension,
  MathModal,
  addMathBlockAfterSelection,
  useMathModalBridge,
} from "@godfreykaris/tiptap-math-block";
```

### 2) Create your editor and modal bridge

```tsx
const MyMathEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit, MathExtension],
    content: `<p>Example content before math block</p>`,
  });

  // Hook that syncs open/close state with MathModal
  const { modalProps } = useMathModalBridge();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          editor && addMathBlockAfterSelection(editor, "x = \\square")
        }
      >
        Add Math Block
      </button>

      <EditorContent editor={editor} />

      {/* Modal for editing math */}
      <MathModal {...modalProps} />
    </div>
  );
};
```

### 3) Adding a new math block

Use `addMathBlockAfterSelection(editor, initialLatex)` to insert a new block.

```ts
addMathBlockAfterSelection(editor, "x = \\square");
```

- **`editor`** → Your Tiptap `Editor` instance
- **`initialLatex`** _(optional)_ → Starter LaTeX for the new block (defaults to `x = \square`).

The helper ensures that:

- If a math block is currently selected, the new one is inserted **after** it (not replacing it).
- The new block starts with your placeholder LaTeX.

---

## How the modal bridge works

`useMathModalBridge()`:

- Listens for `openMathModal` events emitted by the extension's NodeView when you click a math block.
- Returns `modalProps` containing everything `<MathModal />` needs: `isOpen`, `onClose`, `initialLatex`, `initialMatrices`, `onSave`, and `id`.
- Keeps your `App.tsx` lean and package-friendly.

---

## API

### `addMathBlockAfterSelection(editor, initialLatex?)`

Safely inserts a new math block after the selection and seeds it with `initialLatex`.

**Returns:** `boolean` — whether the command ran.

**Example:**

```ts
addMathBlockAfterSelection(editor, "a^2 + b^2 = c^2");
```

---

## Styling & Assets

- The modal and toolbar use Tailwind utility classes by default. You may override or adapt these styles.
- KaTeX CSS is required once globally:

```ts
import "katex/dist/katex.min.css";
```

- Package styles are required once globally:

```ts
import "@godfreykaris/tiptap-math-block/style.css";
```

---

## TypeScript Notes

- The helper uses types from `@tiptap/pm/model` and `@tiptap/pm/state` to avoid bringing in direct `prosemirror-*` packages.
- If you maintain strict ESLint rules (`import/prefer-default-export`, `no-explicit-any`, etc.), the distributed helpers comply.

---

## SSR

If you render on the server, guard browser-only APIs (like `window`) and only mount the editor on the client.

---

## FAQ

**Q: The new math block is empty. Can I set a default?**

A: Yes. Pass a second argument to the helper, e.g. `addMathBlockAfterSelection(editor, 'x = \\square')`.

**Q: My linter complains about `prosemirror-state` as an extraneous dependency.**

A: Import from `@tiptap/pm/state` instead, or add `prosemirror-state` to your project.

**Q: Can I open the modal immediately after inserting the block?**

A: You can dispatch a custom event or extend the command to open it right away. The package exposes the modal bridge so it’s easy to wire up.

---

## License

MIT © 2025 Godfrey Kariuki
