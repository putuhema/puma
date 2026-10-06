"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCrtBulge } from "@/components/crt-bulge";
import { CrtOverlay } from "@/components/crt-overlay";
import { DockedMrP } from "@/components/docked-mr-p";
import { useSfx, useSound } from "@/components/sound-control";
import { useStation } from "@/components/station-context";
import { siteConfig } from "@/lib/site";
import type { Archive } from "@/lib/transmission";

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"))
  );
}

/**
 * The whole site is a tape playing on a CRT: the transmission desk (or an
 * article) edge to edge, no header. Mr. P is the way around: ask him to go
 * somewhere, or use his channel guide. The tube face bulges toward the
 * viewer, so the screen itself scrolls; changing page tears the picture like
 * a bad edit on tape.
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

  // Channels: Alt+1–3 from anywhere, even mid-sentence. Off the chat, where
  // nothing is being typed, the bare number keys tune too, Esc steps back
  // out, and j/k scroll. Esc in a text box hands the keys back first.
  useEffect(() => {
    function tune(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      const number = event.code.startsWith("Digit") ? event.code.slice(5) : null;
      const channel = siteConfig.navigation.find((item) => item.shortcut === number);
      const typing = isTypingTarget(event.target);
      const offChat = pathname !== "/" && !typing;

      if (channel && (event.altKey || (offChat && !event.shiftKey))) {
        event.preventDefault();
        if (channel.href !== pathname) router.push(channel.href);
        return;
      }
      if (typing && pathname !== "/" && event.key === "Escape" && !event.altKey) {
        event.preventDefault();
        screen.current?.focus({ preventScroll: true });
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
