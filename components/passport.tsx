"use client";

import { useSyncExternalStore } from "react";
import { earnedStamps, stampEvent, stamps } from "@/lib/stamps";
import { cn } from "@/lib/utils";

function subscribe(onChange: () => void) {
  window.addEventListener(stampEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(stampEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}
// A string snapshot, so React can compare it.
const readEarned = () => earnedStamps().join(",");

/** The sticker slots on the inside of the tape case. */
export function Passport() {
  const earned = useSyncExternalStore(subscribe, readEarned, () => null);
  const have = earned === null ? [] : earned.split(",").filter(Boolean);

  return (
    <>
      <p className="font-tube text-2xl uppercase">
        {earned === null ? "Counting stickers…" : `${have.length} of ${stamps.length} stickers`}
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stamps.map((stamp, index) => {
          const got = have.includes(stamp.id);
          return (
            <li key={stamp.id} className="flex flex-col items-center gap-2 text-center">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-24 place-items-center rounded-full font-osd text-3xl",
                  got
                    ? "border-4 border-white/80 bg-signal text-amber-glass shadow-[3px_3px_0_var(--osd)] [text-shadow:none]"
                    : "border-2 border-dashed border-rule text-muted-foreground",
                )}
                style={got ? { rotate: `${(index % 2 ? 1 : -1) * (4 + (index % 3) * 3)}deg` } : undefined}
              >
                {got ? "★" : "?"}
              </span>
              <span className={cn("type-osd text-sm", !got && "text-muted-foreground")}>{stamp.title}</span>
              <span className="text-xs leading-4 text-muted-foreground">
                {got ? "Earned" : stamp.hint}
                <span className="sr-only">{got ? "" : ", not earned yet"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
