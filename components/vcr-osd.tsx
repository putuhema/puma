"use client";

import { useEffect, useState } from "react";

/**
 * The VCR's on-screen display. Leave the tab and the tape pauses; come back
 * and it reads ▮▮ PAUSE with a jittery picture, then ▶ PLAY. Going back a
 * page shows ◀◀ REW while the picture rolls (the console says when).
 */
export function VcrOsd({ rewinding }: { rewinding: boolean }) {
  const [label, setLabel] = useState<"pause" | "play" | null>(null);

  useEffect(() => {
    let leftAt = 0;
    const timers: number[] = [];
    function watch() {
      if (document.hidden) {
        leftAt = Date.now();
        return;
      }
      // A glance away isn't a pause.
      if (!leftAt || Date.now() - leftAt < 1500) return;
      timers.forEach(window.clearTimeout);
      setLabel("pause");
      timers.push(
        window.setTimeout(() => setLabel("play"), 900),
        window.setTimeout(() => setLabel(null), 2000),
      );
    }
    document.addEventListener("visibilitychange", watch);
    return () => {
      document.removeEventListener("visibilitychange", watch);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  const shown = rewinding ? "◀◀ REW" : label === "pause" ? "▮▮ PAUSE" : label === "play" ? "▶ PLAY" : null;
  if (!shown) return null;

  return (
    <>
      {(rewinding || label === "pause") && (
        <div aria-hidden="true" data-crt-glass className="animate-jitter pointer-events-none fixed inset-0 z-[55] bg-[repeating-linear-gradient(to_bottom,transparent_0_38px,rgb(255_255_255/0.08)_38px_42px)]" />
      )}
      <p
        aria-hidden="true"
        className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+1rem)] right-5 z-[60] font-osd text-3xl text-foreground uppercase sm:right-8 sm:text-4xl pointer-coarse:right-20"
      >
        {shown}
      </p>
    </>
  );
}
