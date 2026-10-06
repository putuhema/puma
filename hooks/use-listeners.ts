"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { stationSession } from "@/lib/session";

/** Seen this recently, still counts as tuned in. */
const tunedMs = 75_000;

function subscribeToClock(onTick: () => void) {
  const timer = window.setInterval(onTick, 15_000);
  return () => window.clearInterval(timer);
}
const readClock = () => Math.floor(Date.now() / 15_000) * 15_000;

/**
 * Everyone tuned in right now, live from Convex, with this tab marked.
 * Undefined until the first answer arrives. Needs a Convex provider.
 */
export function useListeners() {
  const [sessionId] = useState(() => (typeof window === "undefined" ? undefined : stationSession()));
  const listeners = useQuery(api.listeners.list, { sessionId });
  const clock = useSyncExternalStore(subscribeToClock, readClock, () => null);
  if (!listeners || clock === null) return undefined;
  return listeners.filter((listener) => listener.mine || clock - listener.lastSeen < tunedMs);
}
