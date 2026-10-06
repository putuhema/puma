import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const glassStyles = {
  black: "bg-tube text-tube-foreground",
  amber: "bg-amber-glass text-signal",
  blue: "bg-osd text-osd-foreground",
} as const;

/**
 * The left half of the console: one CRT that fills the output bay. Each
 * channel tunes it to a different glass. Mounting it (i.e. changing channel)
 * powers the tube on through a burst of static.
 */
export function TubeScreen({
  channel,
  label,
  glass,
  fit = false,
  className,
  children,
}: {
  channel: string;
  label: string;
  glass: keyof typeof glassStyles;
  /**
   * Exactly one screen tall at every size, never growing with what's on it,
   * so long content scrolls inside the tube (a chat log, say).
   */
  fit?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:p-5 sm:pt-[calc(env(safe-area-inset-top)+1.25rem)]",
        fit
          ? "h-dvh min-h-[28rem] flex-none"
          : "min-h-[36rem] flex-1 lg:h-dvh lg:min-h-0",
      )}
    >
      <section
        aria-label={`Channel ${channel}: ${label}`}
        className={cn("tube animate-tube-on flex min-h-0 flex-1 flex-col", glassStyles[glass], className)}
      >
        {children}
        <span
          aria-hidden="true"
          className="tv-static animate-static pointer-events-none absolute inset-0 z-20"
        />
      </section>
    </div>
  );
}
