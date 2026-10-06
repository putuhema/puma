"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { OnAir } from "@/components/convex-client-provider";
import { HighScores } from "@/components/high-scores";
import { useSfx } from "@/components/sound-control";
import type { Sfx } from "@/lib/sfx";

type Phase = "ready" | "playing" | "over";
type Kind = "star" | "rock" | "heart";
type Thing = { x: number; y: number; speed: number; kind: Kind; wobble: number };
type Pop = { x: number; y: number; text: string; color: string; age: number };

const font = 20;
const maxLives = 5;
const hiScoreKey = "puma:star-catcher:hi";
const palette = {
  text: "#e9e9e2",
  dim: "#7d857e",
  ship: "#ff7a2e",
  star: "#ffd23f",
  rock: "#ff7a2e",
  heart: "#ff4f7b",
};
const glyphs: Record<Kind, string> = { star: "*", rock: "@", heart: "♥" };
/** Mr. P's saucer, two rows of ASCII. */
const ship = [".-^-.", "<=o=o=>"];

/**
 * Star Catcher: steer Mr. P's saucer along the bottom of the tube, catch the
 * falling stars, dodge the asteroids, grab a heart for a spare life. Catches
 * in a row build a multiplier; it all speeds up the longer you last. Arrow
 * keys or A/D, or drag along the screen; Space to launch.
 */
export function StarCatcher({
  onReport,
  onRecord,
  autoFocus = false,
}: {
  /** Take the keyboard on arrival, so Space launches straight away. */
  autoFocus?: boolean;
  onReport?: (score: number) => void;
  /** Called when a score takes first place on the high-score table. */
  onRecord?: (score: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cabinet = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [finalScore, setFinalScore] = useState(0);
  const sound = useSfx();
  const soundRef = useRef<Sfx>(sound);
  const game = useRef({
    phase: "ready" as Phase,
    held: { left: false, right: false },
    pointerX: null as number | null,
    start: () => {},
  });

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // A frame late: the console focuses the screen on every new page first.
  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => cabinet.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;

    const family = getComputedStyle(element).fontFamily;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let shipX = 0;
    let things: Thing[] = [];
    let pops: Pop[] = [];
    let dust: { x: number; y: number; speed: number }[] = [];
    let score = 0;
    let lives = 3;
    let streak = 0;
    let elapsed = 0;
    let spawnIn = 0;
    let flash = 0;
    let best = Number(window.localStorage.getItem(hiScoreKey) ?? 0) || 0;
    let frame = 0;
    let last = performance.now();
    const state = game.current;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio, 2);
      width = element!.clientWidth;
      height = element!.clientHeight;
      element!.width = width * ratio;
      element!.height = height * ratio;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      shipX = Math.min(Math.max(shipX || width / 2, 40), width - 40);
      dust = Array.from({ length: 40 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 10 + Math.random() * 30,
      }));
      if (state.phase !== "playing") draw();
    }

    const multiplier = () => 1 + Math.floor(streak / 5);
    const shipY = () => height - 34;

    function text(value: string, x: number, y: number, color: string, size = font, align: CanvasTextAlign = "center") {
      context!.font = `${size}px ${family}`;
      context!.textAlign = align;
      context!.fillStyle = color;
      context!.fillText(value, x, y);
    }

    state.start = () => {
      things = [];
      pops = [];
      score = 0;
      lives = 3;
      streak = 0;
      elapsed = 0;
      spawnIn = 0.4;
      shipX = width / 2;
      state.phase = "playing";
      setPhase("playing");
      soundRef.current.send();
      last = performance.now();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };

    function end() {
      state.phase = "over";
      setPhase("over");
      setFinalScore(score);
      if (score > best) {
        best = score;
        window.localStorage.setItem(hiScoreKey, String(best));
      }
      soundRef.current.error();
      draw();
    }

    function spawn() {
      const roll = Math.random();
      const rockChance = Math.min(0.55, 0.3 + elapsed * 0.005);
      const kind: Kind = roll < 0.03 && lives < maxLives ? "heart" : roll < 0.03 + rockChance ? "rock" : "star";
      things.push({
        x: 16 + Math.random() * (width - 32),
        y: -font,
        speed: (70 + elapsed * 3 + Math.random() * 50) * (kind === "rock" ? 1.15 : 1),
        kind,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    function update(delta: number) {
      elapsed += delta;

      // Steering: keys glide, the pointer pulls.
      const { held, pointerX } = state;
      if (held.left) shipX -= 340 * delta;
      if (held.right) shipX += 340 * delta;
      if (pointerX !== null && !held.left && !held.right) shipX += (pointerX - shipX) * Math.min(1, delta * 12);
      shipX = Math.min(Math.max(shipX, 36), width - 36);

      spawnIn -= delta;
      if (spawnIn <= 0) {
        spawn();
        spawnIn = Math.max(0.22, 0.75 - elapsed * 0.008) * (0.6 + Math.random() * 0.8);
      }

      const catchY = shipY();
      for (let index = things.length - 1; index >= 0; index--) {
        const thing = things[index];
        thing.y += thing.speed * delta;
        thing.x += Math.sin(elapsed * 3 + thing.wobble) * 12 * delta;
        const caught = Math.abs(thing.x - shipX) < 34 && Math.abs(thing.y - catchY) < 16;
        if (caught) {
          things.splice(index, 1);
          if (thing.kind === "star") {
            const points = 10 * multiplier();
            score += points;
            streak += 1;
            pops.push({ x: thing.x, y: catchY - 24, text: `+${points}`, color: palette.star, age: 0 });
            soundRef.current.blip();
          } else if (thing.kind === "heart") {
            lives = Math.min(maxLives, lives + 1);
            pops.push({ x: thing.x, y: catchY - 24, text: "+♥", color: palette.heart, age: 0 });
            soundRef.current.receive();
          } else {
            lives -= 1;
            streak = 0;
            flash = 1;
            pops.push({ x: thing.x, y: catchY - 24, text: "OUCH", color: palette.rock, age: 0 });
            soundRef.current.error();
            if (lives <= 0) return end();
          }
        } else if (thing.y > height + font) {
          things.splice(index, 1);
          // A star slipping past breaks the streak.
          if (thing.kind === "star") streak = 0;
        }
      }

      pops = pops.filter((pop) => (pop.age += delta) < 0.8);
      flash = Math.max(0, flash - delta * 3);
      for (const speck of dust) {
        speck.y += speck.speed * delta * (1 + elapsed * 0.02);
        if (speck.y > height) {
          speck.y = 0;
          speck.x = Math.random() * width;
        }
      }
    }

    function draw() {
      context!.clearRect(0, 0, width, height);
      context!.textBaseline = "middle";
      if (flash > 0) {
        context!.fillStyle = `rgba(255,75,62,${flash * 0.25})`;
        context!.fillRect(0, 0, width, height);
      }
      for (const speck of dust) text("·", speck.x, speck.y, palette.dim, 14);

      if (state.phase === "ready") {
        text("STAR CATCHER", width / 2, height * 0.32, palette.ship, 40);
        text(`catch ${glyphs.star} stars   dodge ${glyphs.rock} rocks   grab ${glyphs.heart} lives`, width / 2, height * 0.48, palette.text);
        text("← → / A D or drag to steer", width / 2, height * 0.6, palette.dim);
        text("press SPACE or tap to launch", width / 2, height * 0.72, palette.star);
        if (best) text(`HI ${String(best).padStart(5, "0")}`, width / 2, height * 0.86, palette.dim);
        return;
      }

      for (const thing of things) {
        const spin = thing.kind === "star" ? (Math.floor(elapsed * 6 + thing.wobble) % 2 ? "*" : "+") : glyphs[thing.kind];
        text(spin, thing.x, thing.y, palette[thing.kind], font + 4);
      }
      const shake = flash > 0 && !reduceMotion ? Math.sin(elapsed * 80) * 4 * flash : 0;
      text(ship[0], shipX + shake, shipY() - 10, palette.ship);
      text(ship[1], shipX + shake, shipY() + 6, palette.ship);
      if (state.phase === "playing" && Math.floor(elapsed * 12) % 2) text("'  '", shipX + shake, shipY() + 22, palette.rock, 14);
      for (const pop of pops) {
        context!.globalAlpha = 1 - pop.age / 0.8;
        text(pop.text, pop.x, pop.y - pop.age * 30, pop.color);
        context!.globalAlpha = 1;
      }

      // The readout across the top.
      text(`SCORE ${String(score).padStart(5, "0")}`, 14, 18, palette.text, font, "left");
      if (multiplier() > 1) text(`x${multiplier()}`, 150, 18, palette.star, font, "left");
      text(glyphs.heart.repeat(lives) + "·".repeat(Math.max(0, 3 - lives)), width / 2, 18, palette.heart);
      text(`HI ${String(Math.max(best, score)).padStart(5, "0")}`, width - 14, 18, palette.dim, font, "right");

      if (state.phase === "over") {
        context!.fillStyle = "rgba(5,6,5,0.7)";
        context!.fillRect(0, height * 0.28, width, height * 0.36);
        text("GAME OVER", width / 2, height * 0.38, palette.rock, 36);
        text(score > 0 && score >= best ? `NEW HI SCORE · ${score}` : `SCORE ${score}`, width / 2, height * 0.5, palette.text);
        text("press SPACE or tap to fly again", width / 2, height * 0.59, palette.dim);
      }
    }

    function tick(now: number) {
      if (state.phase !== "playing") return;
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (document.hidden) return;
      update(delta);
      draw();
    }

    const resizer = new ResizeObserver(resize);
    resizer.observe(element);
    resize();

    return () => {
      state.phase = "ready";
      cancelAnimationFrame(frame);
      resizer.disconnect();
    };
  }, []);

  function steer(event: KeyboardEvent<HTMLDivElement>, down: boolean) {
    // Typing initials or using the board's buttons isn't steering.
    if (event.target !== event.currentTarget) return;
    const { held } = game.current;
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") held.left = down;
    else if (key === "arrowright" || key === "d") held.right = down;
    else if (down && (key === " " || key === "enter")) {
      if (game.current.phase !== "playing") game.current.start();
    } else return;
    // Keep these keys in the game, not on the chat line.
    event.preventDefault();
  }

  function follow(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    game.current.pointerX = event.clientX - bounds.left;
  }

  return (
    <div
      ref={cabinet}
      role="application"
      aria-label="Star Catcher. Left and right arrows steer the saucer; Space launches."
      tabIndex={0}
      onKeyDown={(event) => steer(event, true)}
      onKeyUp={(event) => steer(event, false)}
      onBlur={() => Object.assign(game.current.held, { left: false, right: false })}
      className="relative size-full outline-none focus-visible:ring-2 focus-visible:ring-osd"
    >
      <canvas
        ref={canvas}
        onPointerMove={follow}
        onPointerDown={(event) => {
          follow(event);
          event.currentTarget.parentElement?.focus();
          if (game.current.phase !== "playing") game.current.start();
        }}
        onPointerLeave={() => (game.current.pointerX = null)}
        className="size-full touch-none font-tube"
      />
      <p className="sr-only" aria-live="polite">
        {phase === "over" ? `Game over. You scored ${finalScore}.` : phase === "playing" ? "Playing" : ""}
      </p>
      <OnAir>
        <HighScores phase={phase} score={finalScore} onRecord={onRecord} />
      </OnAir>
      {phase === "over" && onReport && (
        <button
          type="button"
          onClick={() => onReport(finalScore)}
          className="absolute bottom-3 left-3 bg-tube-foreground px-2 py-0.5 font-tube text-xl text-tube uppercase outline-none focus-visible:ring-2 focus-visible:ring-osd"
        >
          Tell Mr. P my score
        </button>
      )}
    </div>
  );
}
