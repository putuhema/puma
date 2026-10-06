"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const printTickMs = 16;
/** Long replies speed up so no line takes much more than ~2s to come in. */
const printTicks = 120;

/**
 * Station text that comes in character by character. While a streamed reply
 * is still arriving it keeps up with the stream, then reports back once the
 * whole line is on screen. Screen readers hear it once, finished, from the
 * `LineAnnouncer` beside it, not letter by letter.
 */
export function PrintedText({
  text,
  complete,
  printing,
  onTick,
  onPrinted,
  className,
}: {
  text: string;
  complete: boolean;
  printing: boolean;
  onTick: () => void;
  onPrinted: () => void;
  className?: string;
}) {
  const [count, setCount] = useState(printing ? 0 : text.length);
  const shownCount = useRef(count);
  const done = useRef(!printing);

  useEffect(() => {
    if (!printing) return;
    const step = Math.max(1, Math.ceil(text.length / printTicks));
    let ticks = 0;
    const timer = window.setInterval(() => {
      if (shownCount.current >= text.length) return;
      if (ticks++ % 3 === 0) onTick();
      shownCount.current = Math.min(text.length, shownCount.current + step);
      setCount(shownCount.current);
    }, printTickMs);
    return () => window.clearInterval(timer);
  }, [onTick, printing, text]);

  // Fast-forwarding (printing turned off early) shows everything received.
  const shown = printing ? count : text.length;
  const finished = complete && shown >= text.length;

  useEffect(() => {
    if (finished && !done.current) {
      done.current = true;
      onPrinted();
    }
  }, [finished, onPrinted]);

  return (
    <p className={cn("font-tube text-[1.375rem] leading-7 sm:text-2xl sm:leading-8", className)}>
      <span aria-hidden={!finished || undefined}>{text.slice(0, shown)}</span>
      {!finished && (
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-5 w-2.5 translate-y-0.5 animate-lamp bg-foreground shadow-[0_0_8px_var(--foreground)]"
        />
      )}
    </p>
  );
}

/**
 * A polite live region that reads out each of Mr. P's lines once it's
 * complete, rather than every chunk as it streams in.
 */
export function LineAnnouncer({ text }: { text: string | null }) {
  return (
    <p role="status" className="sr-only">
      {text ? `Mr. P says: ${text}` : ""}
    </p>
  );
}

/** Mr. P mulling it over: three dots bobbing in his bubble. */
export function ThinkingDots() {
  return (
    <p aria-live="polite" className="flex h-8 items-center gap-2">
      <span className="sr-only">Mr. P is thinking</span>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          aria-hidden="true"
          className="size-2.5 animate-bounce bg-foreground shadow-[0_0_8px_var(--foreground)]"
          style={{ animationDelay: `${dot * 140}ms` }}
        />
      ))}
    </p>
  );
}

