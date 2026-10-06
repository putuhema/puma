"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import { useSound } from "@/components/sound-control";
import { cn } from "@/lib/utils";

type Cutting = {
  src: string;
  width: number;
  height: number;
  transform: string;
  hoverTransform: string;
  pressTransform: string;
};

type Letter = {
  character: string;
  cuttings: Cutting[];
};

const createCutting = (
  src: string,
  width: number,
  height: number,
  y: number,
  rotation: number,
  scale: number,
): Cutting => ({
  src,
  width,
  height,
  transform: `translateY(${y}px) rotate(${rotation}deg) scale(${scale})`,
  hoverTransform: `translateY(${y - 7}px) rotate(${rotation + 2}deg) scale(${scale + 0.04})`,
  pressTransform: `translateY(${y}px) rotate(${rotation}deg) scale(${scale - 0.04})`,
});

const letters: Letter[] = [
  {
    character: "p",
    cuttings: [
      createCutting("/fonts/p_1.png", 109, 109, 4, -4, 1.02),
      createCutting("/fonts/p_2.png", 86, 105, -2, 3, 0.96),
      createCutting("/fonts/p_3.png", 117, 123, 3, -2, 1.04),
      createCutting("/fonts/p_4.png", 141, 135, -3, 4, 0.98),
    ],
  },
  {
    character: "u",
    cuttings: [
      createCutting("/fonts/u_1.png", 146, 145, -3, 2, 0.98),
      createCutting("/fonts/u_2.png", 158, 160, 4, -3, 1.03),
      createCutting("/fonts/u_3.png", 118, 117, -1, 4, 0.95),
      createCutting("/fonts/u_4.png", 144, 163, 3, -2, 1),
      createCutting("/fonts/u_5.png", 121, 115, -3, 3, 1.02),
    ],
  },
  {
    character: "m",
    cuttings: [
      createCutting("/fonts/m_1.png", 119, 123, 3, -2, 1.04),
      createCutting("/fonts/m_2.png", 123, 121, -4, 3, 0.98),
      createCutting("/fonts/m_3.png", 127, 126, 2, -3, 1.03),
      createCutting("/fonts/m_4.png", 119, 121, -2, 4, 0.96),
      createCutting("/fonts/m_5.png", 118, 127, 3, -2, 1.01),
    ],
  },
  {
    character: "a",
    cuttings: [
      createCutting("/fonts/a_1.png", 125, 127, -2, 4, 0.98),
      createCutting("/fonts/a_2.png", 125, 125, 4, -3, 1.03),
      createCutting("/fonts/a_3.png", 154, 156, -3, 2, 1),
      createCutting("/fonts/a_4.png", 144, 182, 2, -2, 0.97),
      createCutting("/fonts/a_5.png", 155, 184, -2, 3, 1.02),
    ],
  },
];

const combinationStorageKey = "puma-ransom-combination";

function createRandomCombination(previous: string | null) {
  let next: number[];

  do {
    const randomValues = crypto.getRandomValues(new Uint32Array(letters.length));
    next = letters.map(
      (letter, index) => randomValues[index] % letter.cuttings.length,
    );
  } while (next.join(",") === previous);

  return next;
}

export function RansomWord() {
  const reduceMotion = useReducedMotion();
  const { muted } = useSound();
  const [variants, setVariants] = useState<number[] | null>(null);
  const pickSound = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const next = createRandomCombination(
      sessionStorage.getItem(combinationStorageKey),
    );
    sessionStorage.setItem(combinationStorageKey, next.join(","));
    const frame = requestAnimationFrame(() => setVariants(next));

    return () => cancelAnimationFrame(frame);
  }, []);

  function rotateCutting(index: number) {
    setVariants((current) =>
      current
        ? current.map((variant, letterIndex) =>
            letterIndex === index
              ? (variant + 1) % letters[letterIndex].cuttings.length
              : variant,
          )
        : current,
    );
    if (pickSound.current) {
      pickSound.current.currentTime = 0;
      void pickSound.current.play();
    }
    navigator.vibrate?.(8);
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex items-center gap-1">
        <audio ref={pickSound} src="/pick.mp3" preload="auto" muted={muted} />
        {letters.map((letter, letterIndex) => {
        const activeIndex = variants?.[letterIndex] ?? 0;
        const activeCutting = letter.cuttings[activeIndex];

        return (
          <m.button
            key={letter.character}
            type="button"
            aria-label={`${letter.character}, play a sound and rotate to another paper cutting`}
            animate={{
              transform: reduceMotion ? "none" : activeCutting.transform,
            }}
            whileHover={
              reduceMotion
                ? undefined
                : { transform: activeCutting.hoverTransform }
            }
            whileTap={
              reduceMotion
                ? undefined
                : { transform: activeCutting.pressTransform }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", duration: 0.5, bounce: 0.2 }
            }
            onClick={() => rotateCutting(letterIndex)}
            className="relative size-16 shrink-0 touch-manipulation select-none outline-none ring-offset-4 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring min-[400px]:size-20 sm:size-24"
          >
            {letter.cuttings.map((cutting, cuttingIndex) => (
              <Image
                key={cutting.src}
                src={cutting.src}
                width={cutting.width}
                height={cutting.height}
                sizes="(max-width: 399px) 64px, (max-width: 639px) 80px, 96px"
                alt=""
                draggable={false}
                className={cn(
                  "absolute inset-0 size-full object-contain transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                  variants && cuttingIndex === activeIndex
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
            ))}
          </m.button>
        );
        })}
      </div>
    </LazyMotion>
  );
}
