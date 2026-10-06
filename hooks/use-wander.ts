"use client";

import { useEffect, useRef, type RefObject } from "react";

type Area = { left: number; top: number; right: number; bottom: number };

/** Pixels per second he drifts at; a burst goes a lot faster. */
const driftSpeed = 36;
const burstSpeed = 150;

/**
 * Lets an element float loose like something adrift in zero-g: it wanders
 * inside `area` (viewport coordinates), bumping softly off the edges and
 * now and then zooming off somewhere new. It never rotates; the thing
 * inside does its own bobbing. Hovering holds it still, so it can be
 * clicked. When `roaming` goes false it flies back home (its spot in the
 * layout) and calls `onSettle`; `onDepart` fires when it sets off again.
 * Reduced motion keeps it at home.
 */
export function useWander(
  ref: RefObject<HTMLElement | null>,
  {
    roaming,
    area,
    onSettle,
    onDepart,
  }: {
    roaming: boolean;
    area: () => Area;
    onSettle?: () => void;
    onDepart?: () => void;
  },
) {
  const live = useRef({ roaming, area, onSettle, onDepart });

  useEffect(() => {
    live.current = { roaming, area, onSettle, onDepart };
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let x = 0;
    let y = 0;
    let burst = 0;
    let nextTrick = 4 + Math.random() * 4;
    let heading = Math.random() * Math.PI * 2;
    let hovering = false;
    let settled = true;
    let last = performance.now();
    let frame = 0;

    // How far it may stray from home before leaving the area.
    function limits() {
      const box = live.current.area();
      const rect = element!.getBoundingClientRect();
      const homeLeft = rect.left - x;
      const homeTop = rect.top - y;
      return {
        minX: box.left - homeLeft,
        maxX: box.right - (homeLeft + rect.width),
        minY: box.top - homeTop,
        maxY: box.bottom - (homeTop + rect.height),
      };
    }

    const place = () => {
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    place();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);

    function fly(now: number) {
      frame = requestAnimationFrame(fly);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (document.hidden) return;

      if (live.current.roaming) {
        if (settled) {
          settled = false;
          live.current.onDepart?.();
        }
        const { minX, maxX, minY, maxY } = limits();

        // Every few seconds, a playful zoom off somewhere new.
        nextTrick -= delta;
        if (nextTrick <= 0 && !hovering) {
          burst = 1;
          heading = Math.random() * Math.PI * 2;
          nextTrick = 5 + Math.random() * 6;
        }
        burst = Math.max(0, burst - delta * 0.9);

        // A lazy wander: the heading turns a little at random as it goes.
        heading = (heading + (Math.random() - 0.5) * 1.2 * delta + Math.PI * 2) % (Math.PI * 2);
        const speed = hovering ? 0 : driftSpeed + burst * burst * burstSpeed;
        x += Math.cos(heading) * speed * delta;
        y += Math.sin(heading) * speed * delta;

        // Bump off the walls.
        if (x < minX || x > maxX) {
          heading = (Math.PI * 3 - heading) % (Math.PI * 2);
          x = Math.min(Math.max(x, minX), maxX);
        }
        if (y < minY || y > maxY) {
          heading = Math.PI * 2 - heading;
          y = Math.min(Math.max(y, minY), maxY);
        }
      } else if (!settled) {
        // Called back: fly home.
        const pull = Math.min(1, delta * 3.5);
        x += -x * pull;
        y += -y * pull;
        if (Math.hypot(x, y) < 1) {
          x = 0;
          y = 0;
          settled = true;
          live.current.onSettle?.();
        }
      }
      place();
    }
    frame = requestAnimationFrame(fly);

    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, [ref]);
}
