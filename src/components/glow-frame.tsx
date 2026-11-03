// A white card with a soft shadow and a frame that has a light running around its edge, like the one around the logo
// (see logo.tsx). The animation is defined by the `card-runner` utility in globals.css and is switched off for visitors
// who prefer reduced motion: the faint indigo edge and the glow then stay still.

export function GlowFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Soft glow that follows the running light */}
      <span className="pointer-events-none absolute -inset-2 overflow-hidden rounded-[2rem] opacity-60 blur-xl" aria-hidden>
        <span className="card-runner" />
      </span>

      {/* Frame: a faint indigo edge that is always visible, with a light running over it */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-200/80 via-slate-200/70 to-violet-200/80 p-[3px] shadow-[0_24px_60px_-20px_rgb(49_46_129/0.35),0_8px_20px_-8px_rgb(15_23_42/0.12)]">
        <span className="card-runner" aria-hidden />
        <div className="relative rounded-[21px] bg-white p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
