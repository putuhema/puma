"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { OnAir } from "@/components/convex-client-provider";
import { useListeners } from "@/hooks/use-listeners";
import { formatEntryDate } from "@/lib/format";
import { placeName } from "@/lib/places";
import { stationPhase } from "@/lib/schedule";
import { siteConfig } from "@/lib/site";
import type { Archive } from "@/lib/transmission";
import { cn } from "@/lib/utils";

/** The wall clock, ticking every 15 seconds; null on the server. */
function subscribeToClock(onTick: () => void) {
  const timer = window.setInterval(onTick, 15_000);
  return () => window.clearInterval(timer);
}
const readClock = () => Math.floor(Date.now() / 15_000) * 15_000;
const serverClock = () => null;

function useClock() {
  return useSyncExternalStore(subscribeToClock, readClock, serverClock);
}

function TunedIn() {
  const listeners = useListeners();
  if (!listeners) return null;
  const count = Math.max(1, listeners.length);
  // Where the others are: the busiest page that isn't empty.
  const places = new Map<string, number>();
  for (const listener of listeners) {
    if (!listener.mine) places.set(placeName(listener.path), (places.get(placeName(listener.path)) ?? 0) + 1);
  }
  const busiest = [...places].sort((a, b) => b[1] - a[1])[0];
  return (
    <>
      <li>
        {count} tuned in{count === 1 ? " (you)" : ""}
      </li>
      {busiest && (
        <li>
          {busiest[1]} on {busiest[0]}
        </li>
      )}
    </>
  );
}

/**
 * The station's status line: on air, who's tuned in, what was filed last,
 * and the operator's own clock if one is set. Proof somebody's minding the
 * place.
 */
export function StationReadout({ archive, className }: { archive: Archive; className?: string }) {
  const clock = useClock();
  const latest = [...archive.projects, ...archive.notes].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  const daysOnAir =
    clock === null ? null : Math.max(0, Math.floor((clock - Date.parse(`${siteConfig.onAirSince}T00:00:00Z`)) / 86_400_000));
  const operatorTime =
    clock !== null && siteConfig.timeZone
      ? new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: siteConfig.timeZone,
        }).format(clock)
      : null;

  return (
    <ul aria-label="Station status" className={cn("type-osd flex flex-col gap-0.5 text-[0.6875rem] leading-4 text-muted-foreground", className)}>
      <li className="flex items-center gap-1.5 text-foreground">
        <span aria-hidden="true" className="size-2 animate-lamp bg-stamp shadow-[0_0_6px_var(--stamp)]" />
        {clock !== null && stationPhase(clock) === "night" ? "After hours · night shift" : "On air"}
        {daysOnAir !== null ? ` · day ${daysOnAir + 1}` : ""}
      </li>
      <OnAir>
        <TunedIn />
      </OnAir>
      {latest && (
        <li className="max-w-56 truncate">
          Last filed{" "}
          <Link href={latest.href} className="pointer-events-auto outline-none hover:text-foreground focus-visible:text-foreground">
            {formatEntryDate(latest.publishedAt)}
          </Link>
        </li>
      )}
      {operatorTime && <li>Operator&rsquo;s time {operatorTime}</li>}
    </ul>
  );
}
