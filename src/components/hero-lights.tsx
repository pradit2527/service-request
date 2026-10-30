import type { CSSProperties } from "react";

// Animated background for dark hero panels: twinkling stars, and a white meteor that slides from the
// top-right corner down to the bottom-left corner every METEOR_EVERY_SECONDS.
// Put it inside a `relative overflow-hidden` container, above the watermark and below the content (`relative`).
// Everything is plain CSS, defined in the <style> below, so this file is self-contained. Visitors who prefer
// reduced motion get no meteor and static stars.

export const METEOR_EVERY_SECONDS = 15;
const METEOR_PASS_SECONDS = 2.8; // how long one slide takes
const METEOR_FIRST_DELAY_SECONDS = 2; // first slide shortly after the page loads

type Vars = CSSProperties & Record<`--${string}`, string>;

// x / y in %, s = size in px, dur = twinkle length in seconds, delay shifts it so stars are out of step.
const STARS = [
  { x: 6, y: 18, s: 8, dur: 3.1, delay: -0.4 },
  { x: 14, y: 78, s: 6, dur: 2.4, delay: -1.6 },
  { x: 23, y: 12, s: 7, dur: 3.8, delay: -2.5 },
  { x: 31, y: 88, s: 9, dur: 2.9, delay: -0.9 },
  { x: 41, y: 20, s: 6, dur: 4.2, delay: -3.1 },
  { x: 47, y: 46, s: 5, dur: 2.2, delay: -1.2 },
  { x: 52, y: 70, s: 10, dur: 3.5, delay: -2.0 },
  { x: 58, y: 12, s: 8, dur: 2.7, delay: -0.2 },
  { x: 66, y: 84, s: 7, dur: 4.6, delay: -3.6 },
  { x: 73, y: 34, s: 12, dur: 3.3, delay: -1.0 },
  { x: 80, y: 14, s: 9, dur: 2.5, delay: -2.2 },
  { x: 86, y: 62, s: 11, dur: 3.9, delay: -0.7 },
  { x: 92, y: 28, s: 8, dur: 2.8, delay: -1.9 },
  { x: 95, y: 80, s: 12, dur: 3.6, delay: -2.8 },
] as const;

// The slide takes the first part of each period; the rest of the period the meteor is hidden.
const END = ((METEOR_PASS_SECONDS / METEOR_EVERY_SECONDS) * 100).toFixed(3);
const FADE_IN = (+END * 0.12).toFixed(3);
const FADE_OUT = (+END * 0.85).toFixed(3);
const SLIDE = "rotate(calc(-1 * var(--meteor-angle))) translateX(var(--meteor-travel))";
const START = "rotate(calc(-1 * var(--meteor-angle))) translateX(0)";

const CSS = `
.hero-stars,.hero-meteor{pointer-events:none}
.hero-star{position:absolute;opacity:.6;
  filter:drop-shadow(0 0 4px rgb(255 241 184/.95)) drop-shadow(0 0 10px rgb(255 255 255/.45))}
.hero-star-shape{display:block;width:100%;height:100%;
  background:radial-gradient(circle,#fff 0,#fff3c4 55%,#f5c542 100%);
  clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}

/* Meteor: starts beyond the top-right corner and slides down-left, head first. Angle and travel follow the
   panel's shape (both in beam lengths, just enough to leave through the bottom-left corner): steeper and a
   bit longer on narrow (mobile) panels. */
.hero-meteor{position:absolute;left:100%;top:-6%;width:38%;height:4px;opacity:0;--meteor-angle:42deg;--meteor-travel:-470%;
  transform:${START};
  filter:drop-shadow(0 0 6px rgb(255 255 255/.85)) drop-shadow(0 0 16px rgb(186 215 255/.45))}
@media (min-width:640px){.hero-meteor{--meteor-angle:19deg;--meteor-travel:-390%}}
.hero-meteor-halo{position:absolute;left:0;right:0;top:50%;height:16px;margin-top:-8px;border-radius:9999px;
  background:linear-gradient(to right,rgb(255 255 255/.5),transparent 70%);filter:blur(8px)}
.hero-meteor-body{position:absolute;inset:0;clip-path:polygon(0 0,100% 50%,0 100%);
  background:linear-gradient(to right,#fff 0%,rgb(255 255 255/.9) 8%,rgb(255 255 255/.4) 38%,transparent 100%)}
.hero-meteor-head{position:absolute;left:-3px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:9999px;
  background:#fff;box-shadow:0 0 10px 3px rgb(255 255 255/.9)}

@keyframes hero-twinkle{
  0%,100%{opacity:.12;scale:.4}
  40%{opacity:1;scale:1}
  60%{opacity:.9;scale:.95}
}
@keyframes hero-meteor{
  0%{transform:${START};opacity:0;animation-timing-function:cubic-bezier(.45,.05,.3,1)}
  ${FADE_IN}%{opacity:1}
  ${FADE_OUT}%{opacity:1}
  ${END}%{transform:${SLIDE};opacity:0}
  100%{transform:${SLIDE};opacity:0}
}

@media (prefers-reduced-motion:no-preference){
  .hero-star{animation:hero-twinkle var(--twinkle-dur,3s) ease-in-out var(--twinkle-delay,0s) infinite}
  .hero-meteor{animation:hero-meteor ${METEOR_EVERY_SECONDS}s linear ${METEOR_FIRST_DELAY_SECONDS}s infinite}
}
`;

export function HeroLights() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{CSS}</style>

      <span className="hero-meteor">
        <span className="hero-meteor-halo" />
        <span className="hero-meteor-body" />
        <span className="hero-meteor-head" />
      </span>

      <div className="hero-stars">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="hero-star"
            style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.s, height: star.s, "--twinkle-dur": `${star.dur}s`, "--twinkle-delay": `${star.delay}s` } as Vars}
          >
            <span className="hero-star-shape" />
          </span>
        ))}
      </div>
    </div>
  );
}

// Large, very faint "AIDC TECH" wordmark for the hero's right side. The meteor slides over it, so it catches the light.
export function HeroWatermark() {
  const letters =
    "bg-linear-to-br from-white/20 via-amber-100/12 to-amber-300/10 bg-clip-text text-transparent " +
    "[-webkit-text-stroke:1px_rgb(255_255_255/0.13)]";

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] items-center justify-end pr-7 select-none sm:flex" aria-hidden>
      <div className="text-right">
        <p className={`${letters} text-[clamp(60px,8.5vw,104px)] leading-[0.88] font-bold tracking-[0.07em]`}>AIDC</p>
        <p className={`${letters} text-[clamp(60px,8.5vw,104px)] leading-[0.88] font-bold tracking-[0.07em]`}>TECH</p>
        <p className="mt-3 flex items-center justify-end gap-3 font-mono text-[10px] tracking-[0.55em] text-amber-200/35 uppercase">
          <span className="h-px w-12 bg-linear-to-l from-amber-300/50 to-transparent" />
          Sole Co., Ltd
        </p>
      </div>
    </div>
  );
}
