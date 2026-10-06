"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCrtBulge } from "@/components/crt-bulge";
import { CrtOverlay } from "@/components/crt-overlay";
import { DockedMrP } from "@/components/docked-mr-p";
import { useSfx, useSound } from "@/components/sound-control";
import { useStation } from "@/components/station-context";
import { siteConfig } from "@/lib/site";
import type { Archive } from "@/lib/transmission";
import { cn } from "@/lib/utils";

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"))
  );
}

function SoundSwitch() {
  const { muted, toggleMuted } = useSound();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!muted}
      aria-label="Sound"
      onClick={toggleMuted}
      className="flex shrink-0 items-center gap-2 text-[0.8125rem] font-medium uppercase outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-osd"
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-2.5 w-3.5",
          muted ? "border-[1.5px] border-foreground" : "bg-signal shadow-[0_0_8px_var(--signal)]",
        )}
      />
      <span className="hidden sm:inline">Snd {muted ? "off" : "on"}</span>
    </button>
  );
}

/**
 * The whole site is a tape playing on a CRT: the transmission desk (or an
 * article) under a slim strip carrying the nameplate, the station readout,
 * and sound. The tube face bulges toward the viewer, so the screen itself
 * scrolls; changing page tears the picture like a bad edit on tape.
 */
export function Console({ archive, children }: { archive: Archive; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { screen } = useStation();
  const { toggleMuted } = useSound();
  const sound = useSfx();
  /** Full lens: bend the picture itself, not just the glass. Softens text. */
  const [fullLens, setFullLens] = useState(false);
  const { filters: lensFilters, available: lensAvailable } = useCrtBulge();
  const bulging = fullLens && lensAvailable;
  const previousPath = useRef(pathname);

  // Changing channel: the VCR mechanism clunks.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    sound.channel();
  }, [pathname, sound]);

  // Set controls that work on every page.
  useEffect(() => {
    function operateSet(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code === "KeyM") {
        event.preventDefault();
        toggleMuted();
      } else if (event.code === "KeyB") {
        event.preventDefault();
        setFullLens((value) => !value);
      }
    }

    window.addEventListener("keydown", operateSet);
    return () => window.removeEventListener("keydown", operateSet);
  }, [toggleMuted]);

  // Channels: Alt+1–3 from anywhere. Off the chat, where nothing is being
  // typed, the bare number keys tune too, Esc steps back out, and j/k scroll.
  useEffect(() => {
    function tune(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      const number = event.code.startsWith("Digit") ? event.code.slice(5) : null;
      const channel = siteConfig.navigation.find((item) => item.shortcut === number);
      const offChat = pathname !== "/" && !isTypingTarget(event.target);

      if (channel && (event.altKey || (offChat && !event.shiftKey))) {
        event.preventDefault();
        if (channel.href !== pathname) router.push(channel.href);
        return;
      }
      if (!offChat || event.altKey) return;

      if (event.key === "Escape") {
        const segments = pathname.split("/").filter(Boolean);
        router.push(`/${segments.slice(0, -1).join("/")}`);
        return;
      }
      const glass = screen.current;
      const scrolls: Record<string, () => void> = {
        j: () => glass?.scrollBy({ top: 96 }),
        k: () => glass?.scrollBy({ top: -96 }),
        g: () => glass?.scrollTo({ top: 0 }),
        G: () => glass?.scrollTo({ top: glass.scrollHeight }),
      };
      if (scrolls[event.key]) {
        event.preventDefault();
        scrolls[event.key]();
      }
    }

    window.addEventListener("keydown", tune);
    return () => window.removeEventListener("keydown", tune);
  }, [pathname, router, screen]);

  // The screen keeps its scroll between pages; a new page starts at the top.
  // Away from the desk it takes focus, so arrows, Space and Page keys scroll.
  useEffect(() => {
    screen.current?.scrollTo({ top: 0 });
    if (pathname !== "/") screen.current?.focus({ preventScroll: true });
  }, [pathname, screen]);

  return (
    <>
      {lensFilters}
      {/* The full lens sits on a viewport-sized frame, not the scroller, so only
          what is on screen is drawn through it. */}
      <div className="fixed inset-0 bg-background" style={bulging ? { filter: "url(#crt-bulge)" } : undefined}>
      <div
        ref={screen}
        tabIndex={-1}
        className="size-full overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]"
      >
        <div className="flex min-h-full flex-col">
          <header className="sticky top-0 z-40 border-b border-rule bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
            <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-3 px-3 sm:gap-5 sm:px-6 lg:px-0">
              <Link
                href="/"
                className="flex items-baseline gap-2 whitespace-nowrap outline-none focus-visible:text-osd"
              >
                <span className="font-osd text-2xl leading-none tracking-[0.02em] uppercase">
                  {siteConfig.author}
                </span>
              </Link>
              <nav aria-label="Channels" className="flex flex-1 items-center justify-center gap-1 sm:gap-1.5">
                {siteConfig.navigation.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      aria-keyshortcuts={`Alt+${item.shortcut}`}
                      className={cn(
                        "type-osd flex items-center gap-1.5 px-2 py-1 text-xs leading-4 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground sm:text-sm",
                        active && "bg-osd text-osd-foreground [text-shadow:none] hover:text-osd-foreground",
                      )}
                    >
                      <span aria-hidden="true" className="opacity-70">
                        {item.shortcut}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <SoundSwitch />
            </div>
          </header>
          <div key={pathname} className="animate-tear flex min-w-0 flex-1 flex-col">
            {children}
          </div>
        </div>
      </div>
      {/* Off the chat, Mr. P floats docked in the corner; click him to chat. */}
      {pathname !== "/" && <DockedMrP archive={archive} />}
      </div>
      <CrtOverlay curvedGlass={lensAvailable} />
    </>
  );
}
