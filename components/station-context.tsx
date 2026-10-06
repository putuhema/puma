"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { StationStatus } from "@/lib/transmission";

type StationContextValue = {
  status: StationStatus;
  setStatus: (status: StationStatus) => void;
  /** The tube face: the element that scrolls, since the glass is curved. */
  screen: RefObject<HTMLDivElement | null>;
};

const StationContext = createContext<StationContextValue | null>(null);

/** Shares the desk's status with the readout, and the screen with everyone. */
export function StationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StationStatus>("standby");
  const screen = useRef<HTMLDivElement>(null);
  const value = useMemo(() => ({ status, setStatus, screen }), [status]);

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation() {
  const context = useContext(StationContext);
  if (!context) throw new Error("useStation must be used within a StationProvider");
  return context;
}
