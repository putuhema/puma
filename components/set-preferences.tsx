"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { effectsKey, lensKey, phosphorKey, phosphors, type Phosphor } from "@/lib/preferences";

const changeEvent = "puma-preferences-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

const readEffects = () => localStorage.getItem(effectsKey) !== "off";
const readLens = () => localStorage.getItem(lensKey) !== "off";
const readPhosphor = (): Phosphor => {
  const stored = localStorage.getItem(phosphorKey);
  return phosphors.includes(stored as Phosphor) ? (stored as Phosphor) : "white";
};

function write(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event(changeEvent));
}

type PreferencesValue = {
  /** Scanlines, glow, static and tape tears: the CRT dressing. */
  effects: boolean;
  toggleEffects: () => void;
  /** The full lens: the picture itself bends, not just the glass. */
  lens: boolean;
  toggleLens: () => void;
  /** The tint of the tube's phosphor. */
  phosphor: Phosphor;
  cyclePhosphor: () => Phosphor;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

/** The set's knobs, kept in localStorage and mirrored onto <html>. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const effects = useSyncExternalStore(subscribe, readEffects, () => true);
  const phosphor = useSyncExternalStore(subscribe, readPhosphor, () => "white" as const);
  const lens = useSyncExternalStore(subscribe, readLens, () => true);

  useEffect(() => {
    document.documentElement.dataset.effects = effects ? "on" : "off";
    document.documentElement.dataset.phosphor = phosphor;
  }, [effects, phosphor]);

  const toggleEffects = useCallback(() => write(effectsKey, readEffects() ? "off" : "on"), []);
  const toggleLens = useCallback(() => write(lensKey, readLens() ? "off" : "on"), []);
  const cyclePhosphor = useCallback(() => {
    const next = phosphors[(phosphors.indexOf(readPhosphor()) + 1) % phosphors.length];
    write(phosphorKey, next);
    return next;
  }, []);

  const value = useMemo(
    () => ({ effects, toggleEffects, lens, toggleLens, phosphor, cyclePhosphor }),
    [cyclePhosphor, effects, lens, phosphor, toggleEffects, toggleLens],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within a PreferencesProvider");
  return context;
}
