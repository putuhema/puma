"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const label = muted ? "Unmute sound" : "Mute sound";

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-label={label}
      aria-pressed={muted}
      title={label}
      onClick={toggleMuted}
      className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 rounded-full bg-background/80 shadow-sm backdrop-blur-md"
    >
      {muted ? <VolumeXIcon aria-hidden="true" /> : <Volume2Icon aria-hidden="true" />}
    </Button>
  );
}
