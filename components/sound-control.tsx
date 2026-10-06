"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { sfx, type Sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const soundPreferenceKey = "puma-sound-muted";
const soundPreferenceEvent = "puma-sound-preference-change";

function subscribeToSoundPreference(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(soundPreferenceEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(soundPreferenceEvent, onStoreChange);
  };
}

function getSoundPreference() {
  return localStorage.getItem(soundPreferenceKey) === "true";
}

function getServerSoundPreference() {
  return false;
}

type SoundContextValue = {
  muted: boolean;
  toggleMuted: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const muted = useSyncExternalStore(
    subscribeToSoundPreference,
    getSoundPreference,
    getServerSoundPreference,
  );

  const toggleMuted = useCallback(() => {
    localStorage.setItem(soundPreferenceKey, String(!getSoundPreference()));
    window.dispatchEvent(new Event(soundPreferenceEvent));
  }, []);

  const value = useMemo(() => ({ muted, toggleMuted }), [muted, toggleMuted]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);

  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }

  return context;
}

export function SoundControl() {
  const { muted, toggleMuted } = useSound();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!muted}
      aria-label="Sound"
      onClick={toggleMuted}
      className="flex shrink-0 touch-manipulation flex-col justify-center px-3 text-left outline-none hover:bg-sunken focus-visible:bg-sunken sm:px-4"
    >
      <span aria-hidden="true" className="type-label text-[0.625rem] leading-3 text-muted-foreground">
        Sound
      </span>
      <span aria-hidden="true" className="flex items-center gap-2 text-sm leading-5 font-medium">
        <span
          className={cn(
            "h-2.5 w-3.5",
            muted ? "border-[1.5px] border-foreground" : "bg-foreground",
          )}
        />
        {muted ? "OFF" : "ON"}
      </span>
    </button>
  );
}

const silent: Sfx = {
  key() {},
  send() {},
  receive() {},
  blip() {},
  channel() {},
  error() {},
  emote() {},
};

/** The station's sound effects, or silence when the visitor has muted them. */
export function useSfx(): Sfx {
  const { muted } = useSound();
  return muted ? silent : sfx;
}
