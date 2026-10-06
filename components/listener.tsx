"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { stationSession } from "@/lib/session";

const heartbeatMs = 30_000;

/** Checks this tab in as tuned to the station, while it's being watched. */
export function Listener() {
  const heartbeat = useMutation(api.listeners.heartbeat);

  useEffect(() => {
    const sessionId = stationSession();
    const beat = () => {
      if (!document.hidden) void heartbeat({ sessionId });
    };
    beat();
    const timer = window.setInterval(beat, heartbeatMs);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [heartbeat]);

  return null;
}
