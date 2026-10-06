"use client";

import { useListeners } from "@/hooks/use-listeners";
import { placeName } from "@/lib/places";

/** A stable pseudo-random number in [0, 1) for an id and a salt. */
function seeded(id: string, salt: number) {
  let hash = 2166136261 ^ salt;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 10_000) / 10_000;
}

/**
 * Everyone else tuned in, drifting through the desk's ASCII space as tiny
 * saucers: proof the station's live. Hover one to see where they are.
 */
export function VisitorSaucers() {
  const listeners = useListeners();
  const others = (listeners ?? []).filter((listener) => !listener.mine).slice(0, 12);
  if (others.length === 0) return null;

  return (
    <ul aria-label={`${others.length} other visitor${others.length === 1 ? "" : "s"} tuned in`} className="pointer-events-none absolute inset-0 overflow-hidden">
      {others.map((listener) => {
        const where = placeName(listener.path);
        return (
          <li
            key={listener.id}
            title={`Another visitor, on ${where}`}
            className="animate-saucer pointer-events-auto absolute left-0 font-tube text-sm leading-[0.9] whitespace-pre text-signal/80"
            style={{
              top: `${12 + seeded(listener.id, 1) * 50}%`,
              // Where it parks when motion is reduced.
              ["--rest" as string]: `${8 + seeded(listener.id, 5) * 80}%`,
              animationDuration: `${40 + seeded(listener.id, 2) * 40}s`,
              animationDelay: `-${seeded(listener.id, 3) * 60}s`,
              animationDirection: seeded(listener.id, 4) > 0.5 ? "normal" : "reverse",
            }}
          >
            <span aria-hidden="true">{" .-^-.\n<=o=o=>"}</span>
            <span className="sr-only">A visitor on {where}</span>
          </li>
        );
      })}
    </ul>
  );
}
