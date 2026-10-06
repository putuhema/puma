"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { useSound } from "@/components/sound-control";
import { useNavigationSound } from "@/hooks/use-navigation-sound";
import { cn } from "@/lib/utils";

export type Departure = {
  time: string;
  destination: string;
  platform: string;
  remarks: string;
  href: string;
  external?: boolean;
};

const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const tickMs = 45;

function randomGlyph() {
  return glyphs[Math.floor(Math.random() * glyphs.length)];
}

function fit(text: string, length: number) {
  return text.toUpperCase().padEnd(length).slice(0, length);
}

/**
 * A row of split-flap tiles. Whenever `text` or `spin` changes, every tile
 * rattles through the alphabet and lands on its letter, left to right.
 */
function FlapText({
  text,
  length,
  delay = 0,
  spin = 0,
  boarding = false,
  className,
}: {
  text: string;
  length: number;
  delay?: number;
  spin?: number;
  boarding?: boolean;
  className?: string;
}) {
  const target = fit(text, length);
  const [chars, setChars] = useState(target);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const flipsLeft = Array.from(
      { length },
      (_, index) => 3 + index + Math.floor(Math.random() * 6),
    );
    let timer: number | undefined;
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        let settled = true;
        setChars(
          flipsLeft
            .map((left, index) => {
              if (target[index] === " " && left > 0) flipsLeft[index] = 0;
              if (flipsLeft[index] <= 0) return target[index];
              settled = false;
              flipsLeft[index] -= 1;
              return randomGlyph();
            })
            .join(""),
        );
        if (settled) window.clearInterval(timer);
      }, tickMs);
    }, delay);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [target, length, delay, spin, prefersReducedMotion]);

  const shown = prefersReducedMotion ? target : chars;

  return (
    <span aria-hidden="true" className={cn("flex gap-px", className)}>
      {[...shown].map((char, index) => (
        <span
          key={index}
          className={cn(
            "relative grid h-[calc(var(--cell)*1.45)] w-(--cell) shrink-0 place-items-center overflow-hidden font-label text-[calc(var(--cell)*0.7)] leading-none text-surface transition-colors duration-150 after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-black/55 motion-reduce:transition-none",
            boarding ? "bg-primary" : "bg-flap",
          )}
        >
          <span key={char} className="animate-flap motion-reduce:animate-none">
            {char}
          </span>
        </span>
      ))}
    </span>
  );
}

function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 5_000);
  return () => window.clearInterval(timer);
}

function readClock() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function DepartureBoard({ departures }: { departures: Departure[] }) {
  const { muted } = useSound();
  const playNavigationSound = useNavigationSound();
  const clack = useRef<HTMLAudioElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [spins, setSpins] = useState(() => departures.map(() => 0));
  const clock = useSyncExternalStore(subscribeToClock, readClock, () => "--:--");

  function board(index: number) {
    if (hovered === index) return;
    setHovered(index);
    setSpins((current) => current.map((spin, row) => (row === index ? spin + 1 : spin)));
    if (clack.current && !muted) {
      clack.current.currentTime = 0;
      void clack.current.play().catch(() => {});
    }
  }

  return (
    <section
      aria-labelledby="departures-title"
      className="bg-foreground p-3 text-surface [--cell:clamp(0.9rem,4.1vw,1.25rem)] sm:p-6 lg:[--cell:1.375rem]"
    >
      <audio ref={clack} src="/pick.mp3" preload="auto" />
      <header className="flex items-end justify-between gap-4 pb-4 sm:pb-5">
        <div className="flex flex-col gap-1">
          <p className="type-label text-surface/60">Puma Central</p>
          <h2 id="departures-title" className="font-display text-4xl leading-none sm:text-5xl">
            Departures
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="type-label hidden text-surface/60 sm:inline">Local time</span>
          <FlapText text={clock} length={5} delay={200} />
          <time suppressHydrationWarning className="sr-only">
            {clock}
          </time>
        </div>
      </header>

      <div
        aria-hidden="true"
        className="type-label flex gap-4 border-t border-surface/15 pt-3 pb-2 text-[0.625rem] text-surface/50 sm:gap-6"
      >
        <span className="hidden w-[calc(var(--cell)*5+4px)] sm:block">Time</span>
        <span className="w-[calc(var(--cell)*13+12px)] sm:w-[calc(var(--cell)*16+15px)]">Destination</span>
        <span className="w-[calc(var(--cell)*1)]">Plat</span>
        <span className="hidden lg:block">Remarks</span>
      </div>

      <ol className="flex flex-col" onMouseLeave={() => setHovered(null)}>
        {departures.map((departure, index) => {
          const isBoarding = hovered === index;
          const remarks = isBoarding ? "Now boarding" : departure.remarks;
          const label = `${departure.destination}, platform ${departure.platform}: ${departure.remarks}`;
          const content = (
            <>
              <FlapText
                className="hidden sm:flex"
                text={departure.time}
                length={5}
                delay={index * 140}
              />
              <FlapText
                className="sm:hidden"
                text={departure.destination}
                length={13}
                delay={index * 140}
                spin={spins[index]}
              />
              <FlapText
                className="hidden sm:flex"
                text={departure.destination}
                length={16}
                delay={index * 140}
                spin={spins[index]}
              />
              <FlapText text={departure.platform} length={1} delay={index * 140 + 300} />
              <FlapText
                className="hidden lg:flex"
                text={remarks}
                length={12}
                delay={isBoarding ? 0 : index * 140 + 200}
                boarding={isBoarding}
              />
            </>
          );
          const className =
            "group flex items-center gap-4 border-t border-surface/10 py-2 outline-none focus-visible:bg-surface/5 sm:gap-6";

          return (
            <li key={departure.href}>
              {departure.external ? (
                <a
                  href={departure.href}
                  aria-label={label}
                  onMouseEnter={() => board(index)}
                  onFocus={() => board(index)}
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={departure.href}
                  aria-label={label}
                  onMouseEnter={() => board(index)}
                  onFocus={() => board(index)}
                  onClick={() => playNavigationSound(departure.href)}
                  className={className}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className="type-label border-t border-surface/15 pt-3 text-[0.625rem] text-surface/50">
        Pick a destination · press 2, 3 or 4 to depart
      </p>
    </section>
  );
}
