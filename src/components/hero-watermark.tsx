// The "AIDC TECH" wordmark on the right of the home page header: large, faint and outlined, so it reads as part of the
// panel rather than as content. Put it inside a `relative overflow-hidden` container, below the content (`relative`).
export function HeroWatermark() {
  const letters =
    "bg-linear-to-br from-white/20 via-amber-100/12 to-amber-300/10 bg-clip-text text-transparent " +
    "[-webkit-text-stroke:1px_rgb(255_255_255/0.13)]";
  const size = "text-[clamp(40px,4.8vw,70px)] leading-[0.88] font-bold tracking-[0.07em]";

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] items-center justify-end pr-8 select-none sm:flex" aria-hidden>
      <div className="text-right">
        <p className={`${letters} ${size}`}>AIDC</p>
        <p className={`${letters} ${size}`}>TECH</p>
        <p className="mt-2.5 flex items-center justify-end gap-3 font-mono text-[10px] tracking-[0.55em] text-amber-200/35 uppercase">
          <span className="h-px w-10 bg-linear-to-l from-amber-300/50 to-transparent" />
          Sole Co., Ltd
        </p>
      </div>
    </div>
  );
}
