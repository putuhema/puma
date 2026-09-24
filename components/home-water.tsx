"use client";

import { useSyncExternalStore } from "react";
import { Water } from "@paper-design/shaders-react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionPreference() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getServerReducedMotionPreference() {
  return true;
}

export function HomeWater() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    getServerReducedMotionPreference,
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      aria-hidden="true"
    >
      <Water
        width="100%"
        height="100%"
        image="/monserat.jpg"
        colorBack="#8f8f8f"
        colorHighlight="#ffffff"
        highlights={0.07}
        layering={0.5}
        edges={0.8}
        waves={0.3}
        caustic={0.1}
        size={1}
        speed={prefersReducedMotion ? 0 : 1}
        scale={0.8}
        fit="contain"
      />
    </div>
  );
}
