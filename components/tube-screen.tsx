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
  className,
  children,
}: {
  channel: string;
  label: string;
  glass: keyof typeof glassStyles;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[36rem] flex-1 flex-col p-3 pt-8 sm:p-5 sm:pt-12 lg:h-[calc(100dvh-3.5rem)] lg:min-h-0">
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
