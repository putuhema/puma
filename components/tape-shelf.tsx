import Link from "next/link";
import { cn } from "@/lib/utils";

export type Tape = {
  href: string;
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  stack: string[];
};

/**
 * Channel 04: projects as VHS tapes stacked spine-out on a shelf. Each spine
 * carries the title, what it's built with and the year; pick one to play it.
 * `compact` is the version Mr. P mounts under a reply.
 */
export function TapeShelf({ tapes, compact = false }: { tapes: Tape[]; compact?: boolean }) {
  const Heading = compact ? "p" : "h1";
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col font-tube text-lg leading-5 uppercase sm:text-xl",
        compact ? "gap-3 p-4" : "gap-5 px-5 py-5 sm:px-10 sm:py-8",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Heading className={cn("bg-tube-foreground px-2 text-tube [text-shadow:none]", compact ? "text-xl" : "text-2xl sm:text-3xl")}>
          Tape library · projects
        </Heading>
        <p className="shrink-0 opacity-70">
          {tapes.length} tape{tapes.length === 1 ? "" : "s"}
        </p>
      </div>

      {tapes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="animate-lamp text-2xl text-signal">Shelf empty</p>
          <p className="max-w-sm normal-case opacity-80">No tapes filed yet. Ask Mr. P, or use the transmitter to ask directly.</p>
        </div>
      ) : (
        <ol className={cn("flex flex-col", compact ? "gap-1.5 overflow-y-auto [scrollbar-width:thin]" : "gap-2.5")}>
          {tapes.map((tape, index) => (
            <li key={tape.href}>
              <Link
                href={tape.href}
                className="group flex min-h-14 items-stretch border-2 border-current outline-none hover:bg-tube-foreground hover:text-tube focus-visible:bg-tube-foreground focus-visible:text-tube"
              >
                <span
                  aria-hidden="true"
                  className="grid w-12 shrink-0 place-items-center bg-signal text-2xl text-tube [text-shadow:none]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-2xl leading-6">{tape.title}</span>
                    <span className="shrink-0 opacity-70">SP · {tape.publishedAt.slice(0, 4)}</span>
                  </span>
                  {!compact && <span className="line-clamp-1 normal-case opacity-80">{tape.summary}</span>}
                  {tape.stack.length > 0 && (
                    <span className="truncate text-base leading-5 opacity-70">{tape.stack.join(" · ")}</span>
                  )}
                </span>
                {/* The cassette window: two reels. */}
                <span aria-hidden="true" className="hidden w-28 shrink-0 items-center justify-center gap-3 border-l-2 border-current sm:flex">
                  <span className="size-6 rounded-full border-2 border-current group-hover:animate-spin group-focus-visible:animate-spin motion-reduce:animate-none" />
                  <span className="size-6 rounded-full border-2 border-current group-hover:animate-spin group-focus-visible:animate-spin motion-reduce:animate-none" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {!compact && tapes.length > 0 && (
        <p className="mt-auto pt-4 text-center opacity-60">Pick a tape · ⏎ plays it · Esc steps back</p>
      )}
    </div>
  );
}
