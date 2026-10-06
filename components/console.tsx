"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useCrtBulge } from "@/components/crt-bulge";
import { CrtOverlay } from "@/components/crt-overlay";
import { RemoteControl } from "@/components/remote-control";
import { usePreferences } from "@/components/set-preferences";
import { useSfx, useSound } from "@/components/sound-control";
import { StampToast } from "@/components/stamp-toast";
import { useStation } from "@/components/station-context";
import { VcrOsd } from "@/components/vcr-osd";
import { countVisit } from "@/lib/memory";
import { siteConfig } from "@/lib/site";
import { logChannel } from "@/lib/stamps";
import type { Archive } from "@/lib/transmission";
import { cn } from "@/lib/utils";

/**
 * Mr. P in the corner pulls in Three.js; off the desk he loads after the
 * page itself, so an article is readable before he's drawn.
 */
const DockedMrP = dynamic(() => import("@/components/docked-mr-p").then((module) => module.DockedMrP), {
  ssr: false,
});

/** ↑ ↑ ↓ ↓ ← → ← → B A: the way to the channel that isn't on the guide. */
const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const secretChannel = "/channel-7";

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
  /**
   * Full lens: bend the picture itself, not just the glass. On by default and
   * remembered; it softens text, so Alt+B (or /effects) flattens it.
   */
  const { effects, lens: fullLens, toggleLens } = usePreferences();
  const { filters: lensFilters, available: lensAvailable } = useCrtBulge();
  const bulging = fullLens && lensAvailable && effects;
  const previousPath = useRef(pathname);
  /** The page Back is rewinding to, while the tape rolls. */
  const [rewindPath, setRewindPath] = useState<string | null>(null);
  const rewinding = rewindPath === pathname;
  /**
   * The set's power: on, squeezing down to a dot, off on standby, or
   * blooming back. Only the picture goes; the conversation survives.
   */
  const [power, setPower] = useState<"on" | "turning-off" | "off" | "waking">("on");

  // Changing channel: the VCR mechanism clunks (unless it's rewinding).
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (rewindPath !== pathname) sound.channel();
    logChannel(pathname, siteConfig.navigation.map((item) => item.href));
  }, [pathname, rewindPath, sound]);

  // Counted once per visit, so Mr. P knows a regular.
  useEffect(() => {
    countVisit();
    logChannel(window.location.pathname, siteConfig.navigation.map((item) => item.href));
  }, []);

  // Back (or forward) through history rewinds the tape.
  useEffect(() => {
    let timer = 0;
    function rewind() {
      sound.rewind();
      setRewindPath(window.location.pathname);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setRewindPath(null), 520);
    }
    window.addEventListener("popstate", rewind);
    return () => {
      window.removeEventListener("popstate", rewind);
      window.clearTimeout(timer);
    };
  }, [sound]);

  function switchOff() {
    sound.power(false);
    setPower("turning-off");
    window.setTimeout(() => setPower((state) => (state === "turning-off" ? "off" : state)), 520);
  }

  function switchOn() {
    sound.power(true);
    setPower("waking");
    window.setTimeout(() => setPower((state) => (state === "waking" ? "on" : state)), 260);
  }

  // On standby, any key switches the set back on.
  useEffect(() => {
    if (power !== "off") return;
    function wake(event: KeyboardEvent) {
      event.preventDefault();
      sound.power(true);
      setPower("waking");
      window.setTimeout(() => setPower((state) => (state === "waking" ? "on" : state)), 260);
    }
    window.addEventListener("keydown", wake);
    return () => window.removeEventListener("keydown", wake);
  }, [power, sound]);

  // The Konami code, typed anywhere that isn't a text box.
  useEffect(() => {
    let progress = 0;
    function listen(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      progress = key === konami[progress] ? progress + 1 : key === konami[0] ? 1 : 0;
      if (progress === konami.length) {
        progress = 0;
        router.push(secretChannel);
      }
    }
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, [router]);

  // Set controls that work on every page.
  useEffect(() => {
    function operateSet(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code === "KeyM") {
        event.preventDefault();
        toggleMuted();
      } else if (event.code === "KeyB") {
        event.preventDefault();
        toggleLens();
      }
    }

    window.addEventListener("keydown", operateSet);
    return () => window.removeEventListener("keydown", operateSet);
  }, [toggleLens, toggleMuted]);

  // Channels: Alt+1–3 from anywhere, even mid-sentence. Off the chat, where
  // nothing is being typed, the bare number keys tune too, Esc steps back
  // out, and j/k scroll. Esc in a text box hands the keys back first.
  useEffect(() => {
    function tune(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      const number = event.code.startsWith("Digit") ? event.code.slice(5) : null;
      // Channel 00 is the test card.
      const channel =
        number === "0"
          ? { href: "/test-card", shortcut: "0" }
          : siteConfig.navigation.find((item) => item.shortcut === number);
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
      <div
        className={cn(
          "fixed inset-0 bg-background print:static",
          power === "turning-off" && "animate-tube-off",
          power === "off" && "invisible",
          power === "waking" && "animate-tube-on",
        )}
        style={bulging ? { filter: "url(#crt-bulge)" } : undefined}
      >
      <div
        ref={screen}
        tabIndex={-1}
        className="size-full overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] print:h-auto print:overflow-visible"
      >
        <div className="flex min-h-full flex-col">
          <div key={pathname} className={cn("flex min-w-0 flex-1 flex-col", rewinding ? "animate-rewind" : "animate-tear")}>
            {children}
          </div>
        </div>
      </div>
      {/* Off the chat, Mr. P floats docked in the corner; click him to chat. */}
      {pathname !== "/" && <DockedMrP archive={archive} />}
      </div>
      <CrtOverlay curvedGlass={lensAvailable && effects} />
      <VcrOsd rewinding={rewinding} />
      <StampToast />
      <RemoteControl onPower={switchOff} />
      {power === "off" && (
        <button
          type="button"
          onClick={switchOn}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-end gap-2 bg-black pb-[calc(env(safe-area-inset-bottom)+3rem)] font-osd text-xs text-muted-foreground uppercase outline-none"
        >
          <span aria-hidden="true" className="size-2 animate-lamp rounded-full bg-stamp shadow-[0_0_8px_var(--stamp)]" />
          Standby · tap or press any key to switch on
        </button>
      )}
    </>
  );
}
