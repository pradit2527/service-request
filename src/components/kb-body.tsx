import { parseMarkdown, type Inline } from "@/lib/kb-markdown";

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((item, i) =>
        item.type === "bold" ? (
          <strong key={i} className="font-semibold text-slate-900">
            {item.text}
          </strong>
        ) : item.type === "code" ? (
          <code key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700">
            {item.text}
          </code>
        ) : (
          <span key={i}>{item.text}</span>
        ),
      )}
    </>
  );
}

// Renders the knowledge base markdown subset as React text nodes (no raw HTML is ever injected).
export function KbBody({ body }: { body: string }) {
  const blocks = parseMarkdown(body);

  return (
    <div className="space-y-4 text-[15px] leading-7 text-slate-700 xl:text-base xl:leading-8">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={i} className="mt-8 border-b border-slate-100 pb-2 text-xl font-semibold tracking-tight text-slate-900 first:mt-0">
                <Inlines items={block.inlines} />
              </h2>
            ) : (
              <h3 key={i} className="mt-6 text-lg font-semibold text-slate-900">
                <Inlines items={block.inlines} />
              </h3>
            );
          case "paragraph":
            return (
              <p key={i}>
                <Inlines items={block.inlines} />
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                    <span>
                      <Inlines items={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="space-y-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                      {j + 1}
                    </span>
                    <span>
                      <Inlines items={item} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre key={i} className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100">
                <code>{block.text}</code>
              </pre>
            );
        }
      })}
    </div>
  );
}
