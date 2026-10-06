"use client";

import { useEffect, useState } from "react";
import { useStation } from "@/components/station-context";
import { forgetReading, rememberReading } from "@/lib/memory";
import { awardStamp } from "@/lib/stamps";

function counter(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  return [hours, minutes, whole % 60].map((part) => String(part).padStart(2, "0")).join(":");
}

/**
 * The VCR's tape counter in place of a progress bar: as the visitor reads
 * down the page it runs from 00:00:00 to the piece's length. It also tells
 * Mr. P where they got to, so he can hand them their place next visit, and
 * reaching the end earns a sticker.
 */
export function TapeCounter({ href, title, minutes }: { href: string; title: string; minutes: number }) {
  const { screen } = useStation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const glass = screen.current;
    if (!glass) return;
    let saveTimer = 0;
    function track() {
      const room = glass!.scrollHeight - glass!.clientHeight;
      const at = room > 0 ? Math.min(1, glass!.scrollTop / room) : 0;
      setProgress(at);
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        if (at > 0.97) {
          forgetReading(href);
          awardStamp("reader");
        } else if (at > 0.05) {
          rememberReading({ href, title, progress: at });
        }
      }, 400);
    }
    glass.addEventListener("scroll", track, { passive: true });
    return () => {
      glass.removeEventListener("scroll", track);
      window.clearTimeout(saveTimer);
    };
  }, [href, screen, title]);

  const length = minutes * 60;
  return (
    <span className="font-tube text-base tracking-wider text-foreground normal-case" aria-label={`${Math.round(progress * 100)}% read`}>
      <span aria-hidden="true">
        {progress >= 0.999 ? "■" : "▶"} {counter(progress * length)}
        <span className="text-muted-foreground"> / {counter(length)}</span>
      </span>
    </span>
  );
}
