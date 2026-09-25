"use client";

import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const [selectedDragon, setSelectedDragon] = useState<Dragon | null>(null);
  const activeIndexRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const isAnimatingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const suppressClickRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const openDragon = (dragon: Dragon, index: number) => {
    if (suppressClickRef.current) return;
    moveTo(index, false);
    setSelectedDragon(dragon);
  };

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
        onUpdate: (value) => {
          viewport.scrollLeft = value;
        },
        onComplete: () => {
          isAnimatingRef.current = false;
        },
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
      const nextDistance = Math.abs(
        item.offsetLeft + item.offsetWidth / 2 - center,
      );
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
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4 && !drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;
    event.currentTarget.scrollLeft = drag.startScroll - delta;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.pointerId = -1;
    if (!drag.moved) return;
    suppressClickRef.current = true;
    moveTo(nearestIndex());
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
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
      if (selectedDragon) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']"))
        return;
      event.preventDefault();
      moveTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1), false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, moveTo, selectedDragon]);

  useEffect(() => {
    if (!selectedDragon) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDragon(null);
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleDialogKeyDown);
      previouslyFocused?.focus();
    };
  }, [selectedDragon]);

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <h1 className="text-lg font-[family-name:var(--font-medieval)] ">
          Dragons
        </h1>
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
        <div className={styles.track}>
          {sortedDragons.map((dragon, index) => {
            const normalized = Math.sqrt(
              dragon.sizeMeters / sortedDragons.at(-1)!.sizeMeters,
            );
            const displaySize = 15 + normalized * 25;
            const humanSize = Math.min(
              18,
              Math.max(1, displaySize * (1.8 / dragon.sizeMeters)),
            );
            const isActive = activeIndex === index;

            return (
              <article
                key={dragon.name}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                className={styles.entry}
                style={
                  {
                    "--dragon-size": `${displaySize}rem`,
                    "--human-size": `${humanSize}rem`,
                  } as React.CSSProperties
                }
                aria-current={isActive ? "true" : undefined}
              >
                <div
                  className={styles.entryMotion}
                  style={{
                    opacity: isActive ? 1 : 0.56,
                    transform: isActive
                      ? "translateY(0px) scale(1)"
                      : "translateY(10px) scale(0.96)",
                  }}
                >
                  <div
                    className={styles.info}
                    data-active={isActive && !selectedDragon ? "true" : "false"}
                    aria-hidden={!isActive || selectedDragon !== null}
                  >
                    <p className={styles.origin}>{dragon.origin}</p>
                    <h2 className={styles.name}>{dragon.name}</h2>
                    <p className={styles.size}>
                      {dragon.sizeMeters} m · estimated length
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.dragonButton}
                    aria-label={`Open details about ${dragon.name}`}
                    aria-haspopup="dialog"
                    onClick={() => openDragon(dragon, index)}
                  >
                    <span className={styles.dragonStage}>
                      <motion.span
                        layoutId={`dragon-illustration-${dragon.name}`}
                        className={styles.dragonArtwork}
                        transition={{
                          layout: prefersReducedMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                duration: 0.5,
                                bounce: 0.1,
                              },
                        }}
                      >
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
                      </motion.span>
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
        <button
          className={styles.arrow}
          type="button"
          aria-label="Previous dragon"
          disabled={activeIndex === 0}
          onClick={() => moveTo(activeIndex - 1, true, "click")}
        >
          <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.7} />
        </button>
        <button
          className={styles.arrow}
          type="button"
          aria-label="Next dragon"
          disabled={activeIndex === sortedDragons.length - 1}
          onClick={() => moveTo(activeIndex + 1, true, "click")}
        >
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.7} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {selectedDragon && (
          <motion.div
            key="dragon-detail"
            className="fixed inset-0 z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.button
              type="button"
              aria-label="Close dragon details"
              className="absolute inset-0 h-full w-full cursor-default bg-stone-950/12"
              onClick={() => setSelectedDragon(null)}
            />

            <div className="pointer-events-none absolute inset-y-0 left-0 right-[92vw] hidden items-center justify-center overflow-hidden sm:flex sm:right-[min(48vw,34rem)]">
              <motion.div
                layoutId={`dragon-illustration-${selectedDragon.name}`}
                className="relative aspect-square w-[min(82%,44rem)] origin-bottom"
                transition={{
                  layout: prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", duration: 0.5, bounce: 0.2 },
                }}
              >
                <Image
                  src={selectedDragon.image}
                  alt={`Full illustration of ${selectedDragon.name}`}
                  fill
                  sizes="(min-width: 640px) 52vw, 1px"
                  className="object-contain object-center"
                  priority
                  draggable={false}
                />
              </motion.div>
              <motion.p
                className="absolute bottom-8 left-20 font-mono text-[0.62rem] tracking-[0.18em] text-stone-700/70 uppercase lg:left-24"
                initial={{ opacity: 0, transform: "translateY(8px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={{ opacity: 0, transform: "translateY(4px)" }}
                transition={{ duration: 0.2, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
              >
                Plate {String(sortedDragons.indexOf(selectedDragon) + 1).padStart(2, "0")}
              </motion.p>
            </div>

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="dragon-detail-title"
              aria-describedby="dragon-detail-description"
              className="absolute inset-y-0 right-0 flex w-[92vw] flex-col justify-center overflow-y-auto border-l border-stone-900/10 bg-[#e9dfcd] px-6 py-16 sm:w-[min(48vw,34rem)] sm:px-10 sm:py-20"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translateX(100%)" }
              }
              animate={{ opacity: 1, transform: "translateX(0%)" }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translateX(100%)" }
              }
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close"
                className="absolute top-3 right-3 grid size-9 place-items-center rounded-full text-stone-700 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-stone-900/6 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700"
                onClick={() => setSelectedDragon(null)}
              >
                <X aria-hidden="true" size={18} strokeWidth={1.7} />
              </button>

              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, transform: "translateY(8px)" }
                }
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
              >
                <header className="flex flex-col gap-3">
                  <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-[#98432c] uppercase">
                    {selectedDragon.origin}
                  </p>
                  <h2
                    id="dragon-detail-title"
                    className="font-serif text-4xl leading-none font-medium tracking-[-0.045em] text-stone-900 sm:text-5xl"
                  >
                    {selectedDragon.name}
                  </h2>
                  <p
                    id="dragon-detail-description"
                    className="max-w-md font-serif text-base leading-7 text-stone-700"
                  >
                    {selectedDragon.shortDescription}
                  </p>
                </header>

                <dl className="mt-8 grid grid-cols-2 border-y border-stone-900/12 py-5">
                  <div className="border-r border-stone-900/12 pr-5">
                    <dt className="text-[0.62rem] font-semibold tracking-[0.16em] text-stone-600 uppercase">
                      Estimated length
                    </dt>
                    <dd className="mt-2 font-serif text-2xl tracking-tight text-stone-900">
                      {selectedDragon.sizeMeters} metres
                    </dd>
                  </div>
                  <div className="pl-5">
                    <dt className="text-[0.62rem] font-semibold tracking-[0.16em] text-stone-600 uppercase">
                      Scale class
                    </dt>
                    <dd className="mt-2 font-serif text-2xl tracking-tight text-stone-900">
                      {selectedDragon.sizeMeters < 10
                        ? "Small"
                        : selectedDragon.sizeMeters < 50
                          ? "Great"
                          : "Colossal"}
                    </dd>
                  </div>
                </dl>

                <p className="mt-6 text-xs leading-5 text-stone-600">
                  Field measurements are comparative estimates. Illustration shown in profile for identification.
                </p>
              </motion.div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
