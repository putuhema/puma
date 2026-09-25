"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import { useSound } from "@/components/sound-control";
import { siteConfig } from "@/lib/site";

const navigationIllustrations: Record<
  string,
  {
    src: string;
    width: number;
    height: number;
    restTransform: string;
    hoverTransform: string;
    labelBottom: string;
    sound: string;
  }
> = {
  "/": {
    src: "/menu/home.png",
    width: 87,
    height: 90,
    restTransform: "translateY(5px) rotate(-3deg) scale(0.95)",
    hoverTransform: "translateY(0px) rotate(-1deg) scale(1)",
    labelBottom: "88px",
    sound: "/sound/grunt.mp3",
  },
  "/notes": {
    src: "/menu/notes.png",
    width: 77,
    height: 83,
    restTransform: "translateY(9px) rotate(6deg) scale(0.9)",
    hoverTransform: "translateY(3px) rotate(2deg) scale(0.97)",
    labelBottom: "83px",
    sound: "/sound/write.mp3",
  },
  "/books": {
    src: "/menu/book.png",
    width: 92,
    height: 61,
    restTransform: "translateY(6px) rotate(-2deg) scale(1.03)",
    hoverTransform: "translateY(1px) rotate(0deg) scale(1.08)",
    labelBottom: "62px",
    sound: "/sound/book.mp3",
  },
  "/playground": {
    src: "/menu/playground.png",
    width: 95,
    height: 100,
    restTransform: "translateY(8px) rotate(7deg) scale(0.92)",
    hoverTransform: "translateY(2px) rotate(3deg) scale(0.98)",
    labelBottom: "86px",
    sound: "/sound/dragon.mp3",
  },
};

const shortcutDestinations: ReadonlyMap<string, string> = new Map(
  siteConfig.navigation.map((item) => [item.shortcut, item.href]),
);

export function IllustratedBottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { muted } = useSound();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const soundElements = useRef<Record<string, HTMLAudioElement | null>>({});

  const playNavigationSound = useCallback((href: string) => {
    const sound = soundElements.current[href];
    if (!sound) return;

    sound.currentTime = 0;
    void sound.play();
  }, []);

  useEffect(() => {
    function navigateWithShortcut(event: KeyboardEvent) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches("input, textarea, select, [role='textbox']"));

      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTyping
      ) {
        return;
      }

      const destination = shortcutDestinations.get(event.key);
      if (!destination) return;

      event.preventDefault();
      setHoveredIndex(null);
      playNavigationSound(destination);
      router.push(destination);
    }

    window.addEventListener("keydown", navigateWithShortcut);
    return () => window.removeEventListener("keydown", navigateWithShortcut);
  }, [playNavigationSound, router]);

  return (
    <LazyMotion features={domAnimation}>
      <nav
        aria-label="Primary navigation"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div
          className="pointer-events-auto relative isolate flex items-end"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {siteConfig.navigation.map((item) => (
            <audio
              key={item.href}
              ref={(element) => {
                soundElements.current[item.href] = element;
              }}
              src={navigationIllustrations[item.href].sound}
              preload="auto"
              muted={muted}
            />
          ))}
          {siteConfig.navigation.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const illustration = navigationIllustrations[item.href];
            const isRevealed = hoveredIndex === index;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={isActive ? "page" : undefined}
                aria-keyshortcuts={item.shortcut}
                onMouseEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onClick={() => playNavigationSound(item.href)}
                className="group relative -ml-3 flex h-[6.5rem] w-[5.25rem] touch-manipulation items-end justify-center rounded-t-sm outline-none first:ml-0 hover:z-20 active:scale-[0.97] focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[#3a3024]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0e9db] sm:h-28"
              >
                <m.span
                  initial={false}
                  style={{ bottom: illustration.labelBottom }}
                  animate={{
                    opacity: isRevealed ? 1 : 0,
                    transform: prefersReducedMotion
                      ? "translateX(-50%) translateY(0px) rotate(0deg) scale(1)"
                      : isRevealed
                        ? "translateX(-50%) translateY(0px) rotate(0deg) scale(1)"
                        : "translateX(-50%) translateY(5px) rotate(0deg) scale(0.96)",
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: isRevealed ? 0.18 : 0.12,
                          ease: [0.23, 1, 0.32, 1],
                        }
                  }
                  className="pointer-events-none absolute left-1/2 z-20 whitespace-nowrap font-[family-name:var(--font-medieval)] text-[1.05rem] tracking-[-0.02em] text-[#3a3024] sm:text-xl"
                >
                  {item.label}
                </m.span>
                <m.span
                  aria-hidden="true"
                  initial={false}
                  animate={{
                    transform: prefersReducedMotion
                      ? illustration.restTransform
                      : isRevealed
                        ? illustration.hoverTransform
                        : illustration.restTransform,
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
                  }
                  className="flex h-full w-full origin-bottom items-end justify-center"
                >
                  <Image
                    src={illustration.src}
                    width={illustration.width}
                    height={illustration.height}
                    alt=""
                    sizes="(max-width: 639px) 80px, 96px"
                    className={`max-h-[5rem] w-auto max-w-[5rem] select-none object-contain object-bottom drop-shadow-[0_4px_3px_rgba(49,38,25,0.12)] transition-[filter,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none sm:max-h-[6.5rem] sm:max-w-full sm:drop-shadow-[0_5px_4px_rgba(49,38,25,0.12)] ${isActive || isRevealed ? "grayscale-0 opacity-100" : "grayscale opacity-50"}`}
                  />
                </m.span>
              </Link>
            );
          })}
        </div>
      </nav>
    </LazyMotion>
  );
}
