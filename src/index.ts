// src/index.ts

// Components
export { default as MathModal } from "./components/MathModal";

// Extension
// If MathExtension.tsx has `export default`, use the line below.
// If it has `export const MathExtension = ...`, change this to `export { MathExtension } ...`
export { default as MathExtension } from "./extensions/MathExtension";

// Helper
export { default as addMathBlockAfterSelection } from "./lib/mathBlockHelpers";

// Hook
export { default as useMathModalBridge } from "./hooks/useMathModalBridge";
