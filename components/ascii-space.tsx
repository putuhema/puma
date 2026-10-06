"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Glyph size in CSS pixels; one cell is half as wide as it is tall. */
const cellHeight = 16;
const cellWidth = 8;
const frameMs = 90;
/** Dark to light, for shading the planets. */
const ramp = " .:-=+*%#@";
const twinkle = ["·", "+", "*", "+"];

type Star = { col: number; row: number; glyph: string; phase: number; rate: number; bright: number };

type Body = {
  /** Centre, as a fraction of the screen. */
  x: number;
  y: number;
  /** Radius in rows. */
  radius: number;
  color: string;
  ring?: string;
  /** Surface bands drift by at this many radians a second. */
  spin: number;
};

/** A ringed gas giant up top, a little moon low down. */
const bodies: Body[] = [
  { x: 0.8, y: 0.22, radius: 6, color: "#ff7a2e", ring: "#8fa4ff", spin: 0.25 },
  { x: 0.1, y: 0.8, radius: 3, color: "#9aa59c", spin: 0.1 },
];

function hash(value: number) {
  const s = Math.sin(value * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Outer space in ASCII, painted on a canvas: a twinkling starfield, a ringed
 * planet slowly turning, a small moon, and the odd shooting star. Drawn in
 * the tube font so it reads like the rest of the set. Decoration only.
 */
export function AsciiSpace({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const font = getComputedStyle(element).fontFamily;
    let cols = 0;
    let rows = 0;
    let stars: Star[] = [];
    let comet: { col: number; row: number; speed: number } | null = null;

    function layout() {
      const { clientWidth, clientHeight } = element!;
      const ratio = Math.min(window.devicePixelRatio, 2);
      element!.width = clientWidth * ratio;
      element!.height = clientHeight * ratio;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.ceil(clientWidth / cellWidth);
      rows = Math.ceil(clientHeight / cellHeight);
      // Roughly one star in every forty cells, a few of them bright.
      stars = Array.from({ length: Math.round((cols * rows) / 40) }, (_, index) => ({
        col: Math.floor(hash(index + 1) * cols),
        row: Math.floor(hash(index + 7.3) * rows),
        glyph: hash(index + 3.1) > 0.92 ? "*" : hash(index + 5.7) > 0.6 ? "." : "·",
        phase: hash(index + 9.9) * Math.PI * 2,
        rate: 0.6 + hash(index + 2.2) * 2.2,
        bright: 0.25 + hash(index + 4.4) * 0.55,
      }));
    }

    function cell(glyph: string, col: number, row: number, color: string, alpha: number) {
      context!.globalAlpha = alpha;
      context!.fillStyle = color;
      context!.fillText(glyph, col * cellWidth, row * cellHeight);
    }

    function drawBody(body: Body, time: number) {
      const centreCol = Math.round(body.x * cols);
      const centreRow = Math.round(body.y * rows);
      const { radius } = body;
      const ringOuter = radius * 2;
      const light = { x: -0.6, y: -0.55, z: 0.58 };
      for (let row = -Math.ceil(ringOuter); row <= ringOuter; row++) {
        for (let col = -Math.ceil(ringOuter * 2); col <= ringOuter * 2; col++) {
          // Cells are twice as tall as wide: halve x to keep circles round.
          const x = col / 2 / radius;
          const y = row / radius;
          const inside = x * x + y * y <= 1;
          // The ring: a flat tilted ellipse, hidden where the planet is in front of it.
          if (body.ring) {
            const ringX = col / 2 / ringOuter;
            const ringY = (row + col * 0.1) / (ringOuter * 0.3);
            const reach = ringX * ringX + ringY * ringY;
            const onRing = reach <= 1 && reach >= 0.62;
            const behind = ringY < 0;
            if (onRing && !(inside && behind)) {
              const glyph = reach > 0.84 ? "~" : "=";
              cell(glyph, centreCol + col, centreRow + row, body.ring, 0.7);
              continue;
            }
          }
          if (!inside) continue;
          const z = Math.sqrt(1 - x * x - y * y);
          const shade = Math.max(0, x * light.x + y * light.y + z * light.z);
          // Bands across the surface, drifting as it turns.
          const band = 0.12 * Math.sin(y * 9 + Math.sin(x * 3 + time * body.spin) * 1.5);
          const level = Math.min(ramp.length - 1, Math.max(1, Math.round((shade + band) * (ramp.length - 1))));
          cell(ramp[level], centreCol + col, centreRow + row, body.color, 0.35 + shade * 0.5);
        }
      }
    }

    function draw(time: number) {
      const { clientWidth, clientHeight } = element!;
      context!.clearRect(0, 0, clientWidth, clientHeight);
      context!.font = `${cellHeight}px ${font}`;
      context!.textBaseline = "top";

      for (const star of stars) {
        const glow = reduceMotion ? 1 : 0.5 + 0.5 * Math.sin(time * star.rate + star.phase);
        const glyph = star.glyph === "*" && !reduceMotion ? twinkle[Math.floor(time * star.rate + star.phase) % 4] : star.glyph;
        cell(glyph, star.col, star.row, "#e3ece4", star.bright * (0.35 + glow * 0.65));
      }
      for (const body of bodies) drawBody(body, time);

      // Now and then a shooting star streaks across.
      if (!reduceMotion) {
        if (!comet && Math.random() < 0.006) {
          comet = { col: Math.random() * cols * 0.7, row: Math.random() * rows * 0.4, speed: 40 + Math.random() * 30 };
        }
        if (comet) {
          comet.col += (comet.speed * frameMs) / 1000;
          comet.row += (comet.speed * 0.35 * frameMs) / 1000;
          const tail = "*=-~·";
          for (let index = 0; index < tail.length; index++) {
            cell(tail[index], Math.round(comet.col) - index, Math.round(comet.row - index * 0.35), "#ffd23f", 0.9 - index * 0.17);
          }
          if (comet.col - tail.length > cols || comet.row > rows) comet = null;
        }
      }
      context!.globalAlpha = 1;
    }

    layout();
    const resizer = new ResizeObserver(() => {
      layout();
      draw(performance.now() / 1000);
    });
    resizer.observe(element);
    draw(0);
    if (reduceMotion) return () => resizer.disconnect();

    const timer = window.setInterval(() => draw(performance.now() / 1000), frameMs);
    return () => {
      window.clearInterval(timer);
      resizer.disconnect();
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className={cn("pointer-events-none font-tube", className)} />;
}
