"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/site";

const navigationIllustrations: Record<string, string> = {
  "/": "/home.png",
  "/notes": "/notes.png",
  "/books": "/books.png",
  "/playground": "/playground.png",
};

const shortcutDestinations: ReadonlyMap<string, string> = new Map(
  siteConfig.navigation.map((item) => [item.shortcut, item.href]),
);

export function LiquidGlassNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      router.push(destination);
    }

    window.addEventListener("keydown", navigateWithShortcut);
    return () => window.removeEventListener("keydown", navigateWithShortcut);
  }, [router]);

  return (
    <TooltipProvider delay={450}>
      <nav
        aria-label="Primary navigation"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 sm:bottom-6"
      >
        <svg aria-hidden="true" className="absolute size-0">
          <defs>
            <filter
              id="liquid-glass-nav"
              x="-20%"
              y="-50%"
              width="140%"
              height="200%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.008 0.045"
                numOctaves="2"
                seed="7"
                result="nav-displacement"
              />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="0.35"
                result="nav-blur"
              />
              <feDisplacementMap
                in="nav-blur"
                in2="nav-displacement"
                scale="18"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        <div
          className="pointer-events-auto relative isolate flex items-end gap-1 rounded-[1.45rem] border border-white/50 bg-background/42 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(0,0,0,0.08),0_10px_32px_rgba(28,28,24,0.18)] [backdrop-filter:blur(14px)_url(#liquid-glass-nav)_saturate(160%)] [-webkit-backdrop-filter:blur(14px)_saturate(160%)] contrast-more:border-foreground/45 contrast-more:bg-background/95 contrast-more:backdrop-blur-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-px h-px rounded-full bg-gradient-to-r from-transparent via-white/90 to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 bottom-px h-px rounded-full bg-gradient-to-r from-transparent via-foreground/12 to-transparent"
          />
          {siteConfig.navigation.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const illustration = navigationIllustrations[item.href];
            const hoverDistance =
              hoveredIndex === null ? null : Math.abs(hoveredIndex - index);
            const iconTransform = prefersReducedMotion
              ? "translateY(0px) scale(1)"
              : hoverDistance === 0
                ? "translateY(-8px) scale(1.18)"
                : hoverDistance === 1
                  ? "translateY(-2px) scale(1.06)"
                  : "translateY(0px) scale(1)";

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      prefetch
                      aria-current={isActive ? "page" : undefined}
                      aria-keyshortcuts={item.shortcut}
                      aria-label={item.label}
                      onMouseEnter={() => setHoveredIndex(index)}
                      className="group relative z-10 inline-flex size-14 touch-manipulation items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background/70"
                    />
                  }
                >
                  <motion.span
                    aria-hidden="true"
                    animate={{ transform: iconTransform }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", duration: 0.4, bounce: 0 }
                    }
                    className="relative size-[3.25rem] origin-bottom will-change-transform"
                  >
                    <Image
                      src={illustration}
                      alt=""
                      fill
                      sizes="52px"
                      className="pointer-events-none select-none object-contain drop-shadow-[0_3px_3px_rgba(32,27,21,0.14)]"
                    />
                  </motion.span>
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0.5 size-1 rounded-full bg-foreground/65 transition-opacity duration-150 motion-reduce:transition-none ${isActive ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="sr-only">{item.label}</span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={12}>
                  {item.label} <Kbd>{item.shortcut}</Kbd>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}
