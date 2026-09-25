"use client";

import Image from "next/image";
import { animate, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./dragon-encyclopedia.module.css";

export type Dragon = {
  name: string;
  shortDescription: string;
  origin: string;
  sizeMeters: number;
  image: string;
};

const carouselSpring = { type: "spring", duration: 0.5, bounce: 0.2 } as const;
const clickTransition = {
  duration: 0.24,
  ease: [0.77, 0, 0.175, 1],
} as const;

export function DragonEncyclopedia({ dragons }: { dragons: Dragon[] }) {
  const sortedDragons = useMemo(
    () => [...dragons].sort((a, b) => a.sizeMeters - b.sizeMeters),
    [dragons],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [showHumanScale, setShowHumanScale] = useState(false);
  const activeIndexRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const isAnimatingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, startScroll: 0, moved: false });
  const suppressClickRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const targetFor = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const item = itemRefs.current[index];
    if (!viewport || !item) return 0;
    return item.offsetLeft + item.offsetWidth / 2 - viewport.clientWidth / 2;
  }, []);

  const moveTo = useCallback(
    (index: number, animated = true, motion: "spring" | "click" = "spring") => {
      const nextIndex = Math.max(0, Math.min(sortedDragons.length - 1, index));
      const target = targetFor(nextIndex);
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);

      if (!animated || prefersReducedMotion) {
        isAnimatingRef.current = false;
        viewportRef.current?.scrollTo({ left: target, behavior: "auto" });
        return;
      }

      const viewport = viewportRef.current;
      if (!viewport) return;
      scrollAnimationRef.current?.stop();
      isAnimatingRef.current = true;
      scrollAnimationRef.current = animate(viewport.scrollLeft, target, {
        ...(motion === "click" ? clickTransition : carouselSpring),
        onUpdate: (value) => { viewport.scrollLeft = value; },
        onComplete: () => { isAnimatingRef.current = false; },
      });
    },
    [prefersReducedMotion, sortedDragons.length, targetFor],
  );

  useLayoutEffect(() => {
    const updateMeasurements = () => {
      viewportRef.current?.scrollTo({
        left: targetFor(activeIndexRef.current),
        behavior: "auto",
      });
    };

    updateMeasurements();
    const observer = new ResizeObserver(updateMeasurements);
    if (viewportRef.current) observer.observe(viewportRef.current);
    itemRefs.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, [sortedDragons.length, targetFor]);

  const nearestIndex = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return activeIndexRef.current;
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    itemRefs.current.forEach((item, index) => {
      if (!item) return;
      const nextDistance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    return nearest;
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    scrollAnimationRef.current?.stop();
    isAnimatingRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: event.currentTarget.scrollLeft,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    event.currentTarget.scrollLeft = drag.startScroll - delta;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current.pointerId = -1;
    if (!drag.moved) return;
    suppressClickRef.current = true;
    moveTo(nearestIndex());
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  };

  const handleScroll = () => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      if (isAnimatingRef.current) return;
      const index = nearestIndex();
      moveTo(index);
    }, 100);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      moveTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1), false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, moveTo]);

  return (
    <main className={styles.page}>
        <header className={styles.masthead}>
          <p className={styles.eyebrow}>Field guide · Vol. I</p>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>The Dragon Index</h1>
            <p className={styles.subtitle}>A comparative record of winged beasts, arranged from slight to colossal.</p>
          </div>
          <p className={styles.count} aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {String(sortedDragons.length).padStart(2, "0")}
          </p>
        </header>

        <div
          ref={viewportRef}
          className={styles.viewport}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onScroll={handleScroll}
        >
          <div
            className={styles.track}
          >
            {sortedDragons.map((dragon, index) => {
              const normalized = Math.sqrt(dragon.sizeMeters / sortedDragons.at(-1)!.sizeMeters);
              const displaySize = 15 + normalized * 25;
              const humanSize = Math.min(18, Math.max(1, displaySize * (1.8 / dragon.sizeMeters)));
              const isActive = activeIndex === index;

              return (
                <article
                  key={dragon.name}
                  ref={(element) => { itemRefs.current[index] = element; }}
                  className={styles.entry}
                  style={{
                    "--dragon-size": `${displaySize}rem`,
                    "--human-size": `${humanSize}rem`,
                  } as React.CSSProperties}
                  aria-current={isActive ? "true" : undefined}
                >
                  <div
                    className={styles.entryMotion}
                    style={{
                      opacity: isActive ? 1 : 0.56,
                      transform: isActive ? "translateY(0px) scale(1)" : "translateY(10px) scale(0.96)",
                    }}
                  >
                    <div className={styles.info}>
                      <p className={styles.origin}>{dragon.origin}</p>
                      <h2 className={styles.name}>{dragon.name}</h2>
                      <p className={styles.description}>{dragon.shortDescription}</p>
                      <p className={styles.size}>{dragon.sizeMeters} m · estimated length</p>
                    </div>

                    <button
                      type="button"
                      className={styles.dragonButton}
                      aria-label={`Center ${dragon.name}`}
                      onClick={() => {
                        if (!suppressClickRef.current) moveTo(index, false);
                      }}
                    >
                      <span className={styles.dragonStage}>
                        <Image
                          className={styles.dragonShadow}
                          src={dragon.image}
                          alt=""
                          aria-hidden="true"
                          width={1080}
                          height={1080}
                          sizes="(max-width: 700px) 82vw, 36vw"
                          draggable={false}
                        />
                        <Image
                          className={styles.dragon}
                          src={dragon.image}
                          alt={`Illustration of ${dragon.name}`}
                          width={1080}
                          height={1080}
                          sizes="(max-width: 700px) 82vw, 36vw"
                          priority={index < 2}
                          draggable={false}
                        />
                        {showHumanScale && (
                          <Image
                            className={styles.human}
                            src="/human.png"
                            alt="1.8 metre human shown for scale"
                            width={747}
                            height={1027}
                            draggable={false}
                          />
                        )}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className={styles.controls} aria-label="Dragon navigation">
          <button
            className={styles.scaleToggle}
            type="button"
            aria-pressed={showHumanScale}
            onClick={() => setShowHumanScale((visible) => !visible)}
          >
            Human scale {showHumanScale ? "on" : "off"}
          </button>
          <span className={styles.instruction}>Drag, tap, or use arrows</span>
          <button className={styles.arrow} type="button" aria-label="Previous dragon" disabled={activeIndex === 0} onClick={() => moveTo(activeIndex - 1, true, "click")}>
            <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.7} />
          </button>
          <button className={styles.arrow} type="button" aria-label="Next dragon" disabled={activeIndex === sortedDragons.length - 1} onClick={() => moveTo(activeIndex + 1, true, "click")}>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.7} />
          </button>
        </div>
    </main>
  );
}
