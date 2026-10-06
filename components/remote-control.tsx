"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePreferences } from "@/components/set-preferences";
import { useSfx, useSound } from "@/components/sound-control";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

function Key({
  label,
  onPress,
  className,
  children,
}: {
  label: string;
  onPress: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={cn(
        "flex h-12 touch-manipulation items-center justify-center rounded-md border border-rule bg-sunken font-osd text-sm text-foreground uppercase shadow-[0_3px_0_#000] outline-none active:translate-y-[3px] active:shadow-none focus-visible:ring-2 focus-visible:ring-osd",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * On touch screens there's no Alt key to tune with, so the set comes with a
 * remote: a button in the top corner opens it from the bottom of the screen.
 * Number keys tune the channels, CH ▲▼ steps through them, and the top row
 * works the set.
 */
export function RemoteControl({ onPower }: { onPower: () => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const sound = useSfx();
  const reduceMotion = useReducedMotion();
  const { muted, toggleMuted } = useSound();
  const { effects, toggleEffects } = usePreferences();

  const channels = siteConfig.navigation;
  const index = channels.findIndex((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));
  const current = channels[index];

  function tune(href: string) {
    sound.key();
    setOpen(false);
    if (href !== pathname) router.push(href);
  }

  function step(by: number) {
    const from = index === -1 ? 0 : index;
    tune(channels[(from + by + channels.length) % channels.length].href);
  }

  return (
    <div data-no-print className="pointer-fine:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Remote control"
        onClick={() => {
          sound.key();
          setOpen((value) => !value);
        }}
        className="fixed top-[calc(env(safe-area-inset-top)+0.75rem)] right-3 z-[56] flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-md border border-rule bg-surface shadow-[2px_2px_0_var(--osd)] outline-none focus-visible:ring-2 focus-visible:ring-osd"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-stamp" />
        <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">
          {[0, 1, 2, 3].map((dot) => (
            <span key={dot} className="size-1 rounded-full bg-muted-foreground" />
          ))}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              aria-hidden="true"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[57] bg-black/50"
            />
            <motion.div
              key="remote"
              role="dialog"
              aria-label="Remote control"
              initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: "100%", transition: { duration: 0.18 } }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              drag={reduceMotion ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) setOpen(false);
              }}
              className="fixed inset-x-0 bottom-0 z-[58] mx-auto w-full max-w-sm overscroll-contain rounded-t-3xl border border-b-0 border-rule bg-[#16191a] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_-12px_40px_rgb(0_0_0/0.6)]"
            >
              <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-10 rounded-full bg-rule" />
              {/* The little LCD: what's on. */}
              <p className="mb-4 rounded-sm bg-[#1d2a1f] px-3 py-1.5 text-center font-tube text-xl text-[#9dff9d] uppercase [text-shadow:0_0_6px_rgb(120_255_120/0.6)]">
                {current ? `CH 0${current.shortcut} · ${current.label}` : "Off the dial"}
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                <Key
                  label="Power"
                  onPress={() => {
                    setOpen(false);
                    onPower();
                  }}
                  className="bg-stamp/80 text-white"
                >
                  ⏻
                </Key>
                <Key label={muted ? "Sound on" : "Mute"} onPress={() => toggleMuted()}>
                  Snd {muted ? "off" : "on"}
                </Key>
                <Key label={effects ? "Effects off" : "Effects on"} onPress={() => toggleEffects()}>
                  Fx {effects ? "on" : "off"}
                </Key>

                {channels.map((item) => (
                  <Key key={item.href} label={`Channel ${item.shortcut}, ${item.label}`} onPress={() => tune(item.href)}>
                    <span className="text-xl">{item.shortcut}</span>
                  </Key>
                ))}
                <Key label="Channel 0, test card" onPress={() => tune("/test-card")}>
                  <span className="text-xl">0</span>
                </Key>
                <Key label="TV guide" onPress={() => tune("/guide")}>
                  Guide
                </Key>

                <Key
                  label="Back"
                  onPress={() => {
                    sound.key();
                    setOpen(false);
                    router.back();
                  }}
                >
                  ◀◀
                </Key>
                <Key label="Channel up" onPress={() => step(1)}>
                  CH ▲
                </Key>
                <Key label="Channel down" onPress={() => step(-1)}>
                  CH ▼
                </Key>
              </div>
              <p className="mt-4 text-center font-osd text-[0.625rem] text-muted-foreground uppercase">
                P-4 universal remote · batteries not included
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
