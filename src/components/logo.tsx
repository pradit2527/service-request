import Image from "next/image";

// AIDC Tech logo (public/brand/aidc-logo.jpg, 516x317) in a frame with lights that run around its border.
// The animation is defined by the `logo-runner` utility in globals.css and is switched off for
// visitors who prefer reduced motion (the faint gold-to-blue frame then stays still).

const SIZES = {
  xs: { box: "w-[68px]", px: 68 },
  sm: { box: "w-28", px: 112 },
  md: { box: "w-40", px: 160 },
  lg: { box: "w-56", px: 224 },
} as const;

export function Logo({ size = "md", priority = false, className = "" }: { size?: keyof typeof SIZES; priority?: boolean; className?: string }) {
  const { box, px } = SIZES[size];

  return (
    <span className={`relative inline-block shrink-0 ${box} ${className}`}>
      {/* Soft glow that follows the running light */}
      <span className="pointer-events-none absolute -inset-1.5 overflow-hidden rounded-2xl opacity-70 blur-lg" aria-hidden>
        <span className="logo-runner" />
      </span>

      {/* Frame: a faint gold-to-blue edge that is always visible, with two lights running over it */}
      <span className="relative block overflow-hidden rounded-xl bg-linear-to-br from-amber-300/35 via-amber-200/10 to-sky-400/35 p-[3px] shadow-lg shadow-black/30">
        <span className="logo-runner" aria-hidden />
        <span className="logo-runner" style={{ animationDelay: "-1.8s" }} aria-hidden />
        <span className="relative block overflow-hidden rounded-[9px] bg-slate-950">
          <Image
            src="/brand/aidc-logo.jpg"
            alt="AIDC Tech Sole Co., Ltd"
            width={516}
            height={317}
            sizes={`${px}px`}
            priority={priority}
            className="block h-auto w-full"
          />
        </span>
      </span>
    </span>
  );
}
