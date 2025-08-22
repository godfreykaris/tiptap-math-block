// src/index.ts

// Components
export { default as MathModal } from "./components/MathModal";

// Extensions
// If these files use `export default`, keep the default re-export.
// If they use named exports (`export const ...`), adjust accordingly.
export { default as MathExtension } from "./extensions/MathExtension";
export { default as MathInlineExtension } from "./extensions/MathInlineExtension";

// Helpers
export {
  default as addMathBlockOnNextLine,
  addMathInlineAtSelection,
} from "./lib/mathBlockHelpers";

// Hook
export { default as useMathModalBridge } from "./hooks/useMathModalBridge";

// --- Side-effect imports to ensure typings (command augmentations) are pulled into DTS ---
import "./extensions/MathExtension";
import "./extensions/MathInlineExtension";
