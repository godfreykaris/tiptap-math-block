// types/mathquill.d.ts
interface MathFieldInstance {
  latex: (value?: string) => string;
  typedText: (text: string) => void;
  focus: () => void;
}

interface StaticMathInstance {
  latex: (value?: string) => string;
}

interface MathQuillInterface {
  getInterface: (version: number) => {
    MathField: (
      element: HTMLElement,
      config?: {
        spaceBehavesLikeTab?: boolean;
        handlers?: { edit?: (mathField: MathFieldInstance) => void };
      }
    ) => MathFieldInstance;
    StaticMath: (element: HTMLElement) => StaticMathInstance;
  };
}

declare module 'mathquill/build/mathquill' {
  const MathQuill: MathQuillInterface;
  export = MathQuill;
}

declare global {
  interface Window {
    jQuery: typeof import('jquery');
    $: typeof import('jquery');
    /** Global MathQuill (many builds attach here); keep optional */
    MathQuill?: MathQuillInterface;
    /** Currently active MathQuill field for toolbar insertions */
    activeMQField?: MathFieldInstance;
  }
}
