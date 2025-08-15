import React, { memo, useCallback, useState } from "react";

type SectionProps = {
  children?: React.ReactNode;
};

type MathToolbarProps = {
  /** Triggered when user wants to insert or edit a matrix */
  onStartInsertMatrix?: (preset?: { rows: number; cols: number }) => void;
};

const Section = ({ children }: SectionProps) => (
  <section className="space-y-2">
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </section>
);

const MathToolbar: React.FC<MathToolbarProps> = ({ onStartInsertMatrix }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const insert = useCallback((token: string) => {
    const mf = window.activeMQField;
    if (!mf) return;
    try {
      mf.focus();
      mf.write(token);
    } catch {
      // ignore
    }
  }, []);

  const toggleToolbar = () => {
    setIsExpanded((prev) => !prev);
  };

  const btn =
    "h-9 min-w-9 px-1.5 rounded-lg border text-sm font-medium " +
    "border-zinc-300/70 dark:border-zinc-700/70 " +
    "bg-white/70 dark:bg-zinc-900/60 " +
    "hover:bg-indigo-50 dark:hover:bg-zinc-800 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " +
    "transition-colors";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3 md:p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between ">
        <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Math Toolbar
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleToolbar}
            aria-expanded={isExpanded}
            aria-controls="math-tools-panel"
            className="text-xs inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>{isExpanded ? "See Fewer tools" : "See More tools"}</span>
            <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden>
              <path
                d="M6 8l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={
                  isExpanded
                    ? "rotate-180 transition-transform"
                    : "transition-transform"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={
          isExpanded
            ? "flex flex-nowrap sm:grid sm:gap-4 md:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 overflow-x-auto"
            : "flex flex-wrap sm:flex-nowrap gap-1 justify-center"
        }
      >
        {/* Arithmetic */}
        <Section>
          <button
            type="button"
            aria-label="Insert plus"
            data-testid="insert-plus"
            className={btn}
            onClick={() => insert("+")}
          >
            +
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert minus"
                data-testid="insert-minus"
                className={btn}
                onClick={() => insert("-")}
              >
                −
              </button>
              <button
                type="button"
                aria-label="Insert multiply"
                data-testid="insert-multiply"
                className={btn}
                onClick={() => insert("\\times ")}
              >
                ×
              </button>
              <button
                type="button"
                aria-label="Insert dot"
                data-testid="insert-cdot"
                className={btn}
                onClick={() => insert("\\cdot ")}
              >
                ·
              </button>
              <button
                type="button"
                aria-label="Insert divide"
                data-testid="insert-divide"
                className={btn}
                onClick={() => insert("\\div ")}
              >
                ÷
              </button>
              <button
                type="button"
                aria-label="Insert plus-minus"
                data-testid="insert-pm"
                className={btn}
                onClick={() => insert("\\pm ")}
              >
                ±
              </button>
              <button
                type="button"
                aria-label="Insert minus-plus"
                data-testid="insert-mp"
                className={btn}
                onClick={() => insert("\\mp ")}
              >
                ∓
              </button>
            </>
          )}
        </Section>

        {/* Relations */}
        <Section>
          <button
            type="button"
            aria-label="Insert equals"
            data-testid="insert-equals"
            className={btn}
            onClick={() => insert("=")}
          >
            =
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert not equal"
                data-testid="insert-neq"
                className={btn}
                onClick={() => insert("\\neq ")}
              >
                ≠
              </button>
              <button
                type="button"
                aria-label="Insert less than"
                data-testid="insert-lt"
                className={btn}
                onClick={() => insert("<")}
              >
                &lt;
              </button>
              <button
                type="button"
                aria-label="Insert greater than"
                data-testid="insert-gt"
                className={btn}
                onClick={() => insert(">")}
              >
                &gt;
              </button>
              <button
                type="button"
                aria-label="Insert leq"
                data-testid="insert-leq"
                className={btn}
                onClick={() => insert("\\leq ")}
              >
                ≤
              </button>
              <button
                type="button"
                aria-label="Insert geq"
                data-testid="insert-geq"
                className={btn}
                onClick={() => insert("\\geq ")}
              >
                ≥
              </button>
            </>
          )}
        </Section>

        {/* Roots / Powers / Fractions */}
        <Section>
          <button
            type="button"
            aria-label="Insert square root"
            data-testid="insert-sqrt"
            className={btn}
            onClick={() => insert("\\sqrt{}")}
          >
            √
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert cube root"
                data-testid="insert-cuberoot"
                className={btn}
                onClick={() => insert("\\sqrt[3]{}")}
              >
                ∛
              </button>
              <button
                type="button"
                aria-label="Insert nth root"
                data-testid="insert-nthroot"
                className={btn}
                onClick={() => insert("\\sqrt[{}]{}")}
              >
                ⁿ√
              </button>
              <button
                type="button"
                aria-label="Insert power"
                data-testid="insert-power"
                className={btn}
                onClick={() => insert("^{}")}
              >
                xⁿ
              </button>
              <button
                type="button"
                aria-label="Insert subscript"
                data-testid="insert-subscript"
                className={btn}
                onClick={() => insert("_{}")}
              >
                xₙ
              </button>
              <button
                type="button"
                aria-label="Insert fraction"
                data-testid="insert-fraction"
                className={btn}
                onClick={() => insert("\\frac{}{}")}
              >
                a/b
              </button>
              <button
                type="button"
                aria-label="Insert binomial"
                data-testid="insert-binom"
                className={btn}
                onClick={() => insert("\\binom{}{}")}
              >
                nCk
              </button>
            </>
          )}
        </Section>

        {/* Delimiters */}
        <Section>
          <button
            type="button"
            aria-label="Insert parentheses"
            data-testid="insert-parens"
            className={btn}
            onClick={() => insert("\\left( \\right)")}
          >
            ( )
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert brackets"
                data-testid="insert-brackets"
                className={btn}
                onClick={() => insert("\\left[ \\right]")}
              >
                [ ]
              </button>
              <button
                type="button"
                aria-label="Insert braces"
                data-testid="insert-braces"
                className={btn}
                onClick={() => insert("\\left\\{ \\right\\}")}
              >
                {"{ }"}
              </button>
              <button
                type="button"
                aria-label="Insert absolute value"
                data-testid="insert-abs"
                className={btn}
                onClick={() => insert("\\left| \\right|")}
              >
                |x|
              </button>
              <button
                type="button"
                aria-label="Insert norm"
                data-testid="insert-norm"
                className={btn}
                onClick={() => insert("\\left\\lVert \\right\\rVert")}
              >
                ‖x‖
              </button>
              <button
                type="button"
                aria-label="Insert floor"
                data-testid="insert-floor"
                className={btn}
                onClick={() => insert("\\left\\lfloor \\right\\rfloor")}
              >
                ⌊x⌋
              </button>
              <button
                type="button"
                aria-label="Insert ceil"
                data-testid="insert-ceil"
                className={btn}
                onClick={() => insert("\\left\\lceil \\right\\rceil")}
              >
                ⌈x⌉
              </button>
            </>
          )}
        </Section>

        {/* Trig / Logs */}
        <Section>
          <button
            type="button"
            aria-label="Insert sin"
            data-testid="insert-sin"
            className={btn}
            onClick={() => insert("\\sin ")}
          >
            sin
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert cos"
                data-testid="insert-cos"
                className={btn}
                onClick={() => insert("\\cos ")}
              >
                cos
              </button>
              <button
                type="button"
                aria-label="Insert tan"
                data-testid="insert-tan"
                className={btn}
                onClick={() => insert("\\tan ")}
              >
                tan
              </button>
              <button
                type="button"
                aria-label="Insert arcsin"
                data-testid="insert-arcsin"
                className={btn}
                onClick={() => insert("\\arcsin ")}
              >
                arcsin
              </button>
              <button
                type="button"
                aria-label="Insert arccos"
                data-testid="insert-arccos"
                className={btn}
                onClick={() => insert("\\arccos ")}
              >
                arccos
              </button>
              <button
                type="button"
                aria-label="Insert arctan"
                data-testid="insert-arctan"
                className={btn}
                onClick={() => insert("\\arctan ")}
              >
                arctan
              </button>
              <button
                type="button"
                aria-label="Insert log"
                data-testid="insert-log"
                className={btn}
                onClick={() => insert("\\log ")}
              >
                log
              </button>
              <button
                type="button"
                aria-label="Insert log base"
                data-testid="insert-log-base"
                className={btn}
                onClick={() => insert("\\log_{} ")}
              >
                log₍₎
              </button>
              <button
                type="button"
                aria-label="Insert natural log"
                data-testid="insert-ln"
                className={btn}
                onClick={() => insert("\\ln ")}
              >
                ln
              </button>
              <button
                type="button"
                aria-label="Insert exp"
                data-testid="insert-exp"
                className={btn}
                onClick={() => insert("e^{}")}
              >
                eˣ
              </button>
            </>
          )}
        </Section>

        {/* Greek / Constants */}
        <Section>
          <button
            type="button"
            aria-label="Insert pi"
            data-testid="insert-pi"
            className={btn}
            onClick={() => insert("\\pi ")}
          >
            π
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert theta"
                data-testid="insert-theta"
                className={btn}
                onClick={() => insert("\\theta ")}
              >
                θ
              </button>
              <button
                type="button"
                aria-label="Insert alpha"
                data-testid="insert-alpha"
                className={btn}
                onClick={() => insert("\\alpha ")}
              >
                α
              </button>
              <button
                type="button"
                aria-label="Insert beta"
                data-testid="insert-beta"
                className={btn}
                onClick={() => insert("\\beta ")}
              >
                β
              </button>
              <button
                type="button"
                aria-label="Insert lambda"
                data-testid="insert-lambda"
                className={btn}
                onClick={() => insert("\\lambda ")}
              >
                λ
              </button>
              <button
                type="button"
                aria-label="Insert mu"
                data-testid="insert-mu"
                className={btn}
                onClick={() => insert("\\mu ")}
              >
                μ
              </button>
              <button
                type="button"
                aria-label="Insert infinity"
                data-testid="insert-infty"
                className={btn}
                onClick={() => insert("\\infty ")}
              >
                ∞
              </button>
            </>
          )}
        </Section>

        {/* Big operators / Limits / Logic arrows */}
        <Section>
          <button
            type="button"
            aria-label="Insert sum"
            data-testid="insert-sum"
            className={btn}
            onClick={() => insert("\\sum_{}^{} ")}
          >
            Σ
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert product"
                data-testid="insert-prod"
                className={btn}
                onClick={() => insert("\\prod_{}^{} ")}
              >
                ∏
              </button>
              <button
                type="button"
                aria-label="Insert limit"
                data-testid="insert-limit"
                className={btn}
                onClick={() => insert("\\lim_{x \\to } ")}
              >
                lim
              </button>
              <button
                type="button"
                aria-label="Insert to"
                data-testid="insert-to"
                className={btn}
                onClick={() => insert("\\to ")}
              >
                →
              </button>
              <button
                type="button"
                aria-label="Insert implies"
                data-testid="insert-implies"
                className={btn}
                onClick={() => insert("\\implies ")}
              >
                ⇒
              </button>
              <button
                type="button"
                aria-label="Insert iff"
                data-testid="insert-iff"
                className={btn}
                onClick={() => insert("\\iff ")}
              >
                ⇔
              </button>
              <button
                type="button"
                aria-label="Insert mapsto"
                data-testid="insert-mapsto"
                className={btn}
                onClick={() => insert("\\mapsto ")}
              >
                ↦
              </button>
            </>
          )}
        </Section>

        {/* Calculus */}
        <Section>
          <button
            type="button"
            aria-label="Insert integral"
            data-testid="insert-int"
            className={btn}
            onClick={() => insert("\\int_{}^{} ")}
          >
            ∫
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert double integral"
                data-testid="insert-iint"
                className={btn}
                onClick={() => insert("\\iint_{}^{} ")}
              >
                ∬
              </button>
              <button
                type="button"
                aria-label="Insert triple integral"
                data-testid="insert-iiint"
                className={btn}
                onClick={() => insert("\\iiint_{}^{} ")}
              >
                ∭
              </button>
              <button
                type="button"
                aria-label="Insert derivative"
                data-testid="insert-derivative"
                className={btn}
                onClick={() => insert("\\frac{d}{dx}\\left( \\right)")}
              >
                d/dx( )
              </button>
              <button
                type="button"
                aria-label="Insert partial derivative"
                data-testid="insert-partial"
                className={btn}
                onClick={() =>
                  insert("\\frac{\\partial}{\\partial x}\\left( \\right)")
                }
              >
                ∂/∂x( )
              </button>
              <button
                type="button"
                aria-label="Insert nabla"
                data-testid="insert-nabla"
                className={btn}
                onClick={() => insert("\\nabla ")}
              >
                ∇
              </button>
              <button
                type="button"
                aria-label="Insert evaluated bar"
                data-testid="insert-evalbar"
                className={btn}
                onClick={() => insert("\\Big|_{a}^{b}")}
              >
                |ᵃ_b
              </button>
              <button
                type="button"
                aria-label="Insert dx"
                data-testid="insert-dx"
                className={btn}
                onClick={() => insert("\\,dx")}
              >
                dx
              </button>
            </>
          )}
        </Section>

        {/* Vectors / Accents */}
        <Section>
          <button
            type="button"
            aria-label="Insert vector"
            data-testid="insert-vec"
            className={btn}
            onClick={() => insert("\\vec {}")}
          >
            →x
          </button>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert hat"
                data-testid="insert-hat"
                className={btn}
                onClick={() => insert("\\hat{}")}
              >
                x̂
              </button>
              <button
                type="button"
                aria-label="Insert bar"
                data-testid="insert-bar"
                className={btn}
                onClick={() => insert("\\bar{}")}
              >
                x̄
              </button>
              <button
                type="button"
                aria-label="Insert tilde"
                data-testid="insert-tilde"
                className={btn}
                onClick={() => insert("\\tilde{}")}
              >
                x̃
              </button>
              <button
                type="button"
                aria-label="Insert overline"
                data-testid="insert-overline"
                className={btn}
                onClick={() => insert("\\overline{}")}
              >
                overline
              </button>
              <button
                type="button"
                aria-label="Insert underline"
                data-testid="insert-underline"
                className={btn}
                onClick={() => insert("\\underline{}")}
              >
                underline
              </button>
            </>
          )}
        </Section>

        {/* Sets & Stats */}
        <Section>
          {isExpanded && (
            <>
              {/* Sets */}
              <button
                type="button"
                aria-label="Insert reals"
                data-testid="insert-reals"
                className={btn}
                onClick={() => insert("ℝ ")}
              >
                ℝ
              </button>
              <button
                type="button"
                aria-label="Insert naturals"
                data-testid="insert-nats"
                className={btn}
                onClick={() => insert("ℕ ")}
              >
                ℕ
              </button>
              <button
                type="button"
                aria-label="Insert integers"
                data-testid="insert-ints"
                className={btn}
                onClick={() => insert("ℤ ")}
              >
                ℤ
              </button>
              <button
                type="button"
                aria-label="Insert rationals"
                data-testid="insert-rats"
                className={btn}
                onClick={() => insert("ℚ ")}
              >
                ℚ
              </button>
              <button
                type="button"
                aria-label="Insert complexes"
                data-testid="insert-complex"
                className={btn}
                onClick={() => insert("ℂ ")}
              >
                ℂ
              </button>

              {/* Statistics */}
              <button
                type="button"
                aria-label="Insert probability"
                data-testid="insert-prob"
                className={btn}
                onClick={() => insert("\\Pr\\left(\\right)")}
              >
                P( )
              </button>

              <button
                type="button"
                aria-label="Insert variance"
                data-testid="insert-var"
                className={btn}
                onClick={() => insert("\\mathrm{Var}\\left(\\right)")}
              >
                Var( )
              </button>
              <button
                type="button"
                aria-label="Insert covariance"
                data-testid="insert-cov"
                className={btn}
                onClick={() => insert("\\mathrm{Cov}\\left(\\ ,\\ \\right)")}
              >
                Cov( , )
              </button>
            </>
          )}
        </Section>

        {/* Set operations */}
        <Section>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert in"
                data-testid="insert-in"
                className={btn}
                onClick={() => insert("\\in ")}
              >
                ∈
              </button>
              <button
                type="button"
                aria-label="Insert notin"
                data-testid="insert-notin"
                className={btn}
                onClick={() => insert("\\notin ")}
              >
                ∉
              </button>
              <button
                type="button"
                aria-label="Insert subseteq"
                data-testid="insert-subseteq"
                className={btn}
                onClick={() => insert("\\subseteq ")}
              >
                ⊆
              </button>
              <button
                type="button"
                aria-label="Insert supseteq"
                data-testid="insert-supseteq"
                className={btn}
                onClick={() => insert("\\supseteq ")}
              >
                ⊇
              </button>
              <button
                type="button"
                aria-label="Insert union"
                data-testid="insert-cup"
                className={btn}
                onClick={() => insert("\\cup ")}
              >
                ∪
              </button>
              <button
                type="button"
                aria-label="Insert intersection"
                data-testid="insert-cap"
                className={btn}
                onClick={() => insert("\\cap ")}
              >
                ∩
              </button>
              <button
                type="button"
                aria-label="Insert empty set"
                data-testid="insert-emptyset"
                className={btn}
                onClick={() => insert("\\emptyset ")}
              >
                ∅
              </button>
              <button
                type="button"
                aria-label="Insert forall"
                data-testid="insert-forall"
                className={btn}
                onClick={() => insert("\\forall ")}
              >
                ∀
              </button>
              <button
                type="button"
                aria-label="Insert exists"
                data-testid="insert-exists"
                className={btn}
                onClick={() => insert("\\exists ")}
              >
                ∃
              </button>
              <button
                type="button"
                aria-label="Insert land"
                data-testid="insert-land"
                className={btn}
                onClick={() => insert("\\land ")}
              >
                ∧
              </button>
              <button
                type="button"
                aria-label="Insert lor"
                data-testid="insert-lor"
                className={btn}
                onClick={() => insert("\\lor ")}
              >
                ∨
              </button>
              <button
                type="button"
                aria-label="Insert neg"
                data-testid="insert-neg"
                className={btn}
                onClick={() => insert("\\neg ")}
              >
                ¬
              </button>
            </>
          )}
        </Section>

        {/* Geometry */}
        <Section>
          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert degree"
                data-testid="insert-degree"
                className={btn}
                onClick={() => insert("^{\\circ}")}
              >
                °
              </button>
              <button
                type="button"
                aria-label="Insert angle"
                data-testid="insert-angle"
                className={btn}
                onClick={() => insert("\\angle ")}
              >
                ∠
              </button>
              <button
                type="button"
                aria-label="Insert perpendicular"
                data-testid="insert-perp"
                className={btn}
                onClick={() => insert("\\perp ")}
              >
                ⟂
              </button>
              <button
                type="button"
                aria-label="Insert parallel"
                data-testid="insert-parallel"
                className={btn}
                onClick={() => insert("\\parallel ")}
              >
                ∥
              </button>
            </>
          )}
        </Section>

        {/* Matrix buttons now open the mini matrix editor */}
        <Section>
          <button
            type="button"
            aria-label="Insert 2x2 matrix"
            data-testid="insert-mat-2x2"
            className={btn}
            onClick={() => onStartInsertMatrix?.({ rows: 2, cols: 2 })}
          >
            [2×2]
          </button>

          {isExpanded && (
            <>
              <button
                type="button"
                aria-label="Insert 3x3 matrix"
                data-testid="insert-mat-3x3"
                className={btn}
                onClick={() => onStartInsertMatrix?.({ rows: 3, cols: 3 })}
              >
                [3×3]
              </button>

              <button
                type="button"
                aria-label="Insert 4x4 matrix"
                data-testid="insert-mat-4x4"
                className={btn}
                onClick={() => onStartInsertMatrix?.({ rows: 4, cols: 4 })}
              >
                [4×4]
              </button>
            </>
          )}
        </Section>
      </div>
    </div>
  );
};

MathToolbar.displayName = "MathToolbar";
export default memo(MathToolbar);
