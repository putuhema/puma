"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { stationSession } from "@/lib/session";

const heartbeatMs = 30_000;

/** Checks this tab in as tuned to the station, and on which page, while it's watched. */
export function Listener() {
  const heartbeat = useMutation(api.listeners.heartbeat);
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = stationSession();
    const beat = () => {
      if (!document.hidden) void heartbeat({ sessionId, path: pathname });
    };
    beat();
    const timer = window.setInterval(beat, heartbeatMs);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [heartbeat, pathname]);

  return null;
}
