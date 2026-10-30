const GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
];

const SIZE = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-xl",
} as const;

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

// Thai and Lao leading vowels (เ แ โ ใ ไ / ເ ແ ໂ ໃ ໄ) make a poor initial, so use the consonant that follows.
function initialOf(name: string): string {
  const trimmed = name.trim().replace(/^[เแโใไເແໂໃໄ]+/, "");
  return (Array.from(trimmed)[0] ?? "?").toUpperCase();
}

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZE }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-white shadow-xs ring-2 ring-white ${
        GRADIENTS[hash(name) % GRADIENTS.length]
      } ${SIZE[size]}`}
      title={name}
      aria-hidden
    >
      {initialOf(name)}
    </span>
  );
}
