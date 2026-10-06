"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSfx } from "@/components/sound-control";
import { stampEvent, stamps, type StampId } from "@/lib/stamps";

/**
 * A sticker landing: a short notice at the top of the set, with a ding.
 * Animated in plain CSS, so it doesn't pull an animation library onto pages
 * that otherwise don't need one.
 */
export function StampToast() {
  const sound = useSfx();
  const [stamp, setStamp] = useState<(typeof stamps)[number] | null>(null);

  useEffect(() => {
    let timer = 0;
    function earned(event: Event) {
      const found = stamps.find((item) => item.id === (event as CustomEvent<StampId>).detail);
      if (!found) return;
      sound.stamp();
      setStamp(found);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setStamp(null), 4200);
    }
    window.addEventListener(stampEvent, earned);
    return () => {
      window.removeEventListener(stampEvent, earned);
      window.clearTimeout(timer);
    };
  }, [sound]);

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] flex justify-center px-3">
      {stamp && (
          <div
            key={stamp.id}
            className="animate-stamp-land type-osd pointer-events-auto flex items-center gap-3 border-2 border-signal bg-surface px-3 py-2 text-sm shadow-[4px_4px_0_var(--osd)]"
          >
            <span aria-hidden="true" className="text-xl text-signal">★</span>
            <span>
              Sticker: {stamp.title}
              <span className="block text-[0.6875rem] text-muted-foreground normal-case">{stamp.hint}</span>
            </span>
            <Link href="/passport" className="text-xs text-osd underline-offset-2 outline-none hover:underline focus-visible:underline">
              Passport
            </Link>
          </div>
      )}
    </div>
  );
}
