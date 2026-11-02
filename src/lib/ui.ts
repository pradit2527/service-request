// Shared Tailwind class strings, so forms, buttons and cards look the same everywhere.

export const inputClass =
  "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-xs sm:text-sm " +
  "placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 " +
  "disabled:bg-slate-50 disabled:text-slate-500";

export const inputErrorClass = "border-red-300 focus:border-red-500 focus:ring-red-500/15";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap " +
  "transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 enabled:active:scale-[0.98]";

export const btnPrimary =
  `${buttonBase} bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 ` +
  "hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-600/30";

export const btnSecondary =
  `${buttonBase} bg-white text-slate-700 shadow-xs ring-1 ring-inset ring-slate-200 ` +
  "hover:bg-slate-50 hover:ring-slate-300";

export const btnDanger = `${buttonBase} bg-white text-red-600 shadow-xs ring-1 ring-inset ring-red-200 hover:bg-red-50`;

export const cardClass = "rounded-2xl border border-slate-200/80 bg-white shadow-card";

/** Added to a button class to make it small, for the buttons at the end of a table row. */
export const btnTiny = "px-2.5! py-1! text-xs!";

export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
export const errorTextClass = "mt-1.5 text-xs font-medium text-red-600";
export const helpTextClass = "mt-1.5 text-xs text-slate-500";
