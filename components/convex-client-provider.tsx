"use client";

import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
/** One client for the whole tab, made only when there's somewhere to connect. */
const client = url ? new ConvexReactClient(url) : null;

/**
 * Connects the station to Convex. Without a deployment configured it passes
 * its children through untouched; anything live sits inside `OnAir`, so
 * the rest of the site still works.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!client) return children;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

/** Renders its children only when the live backend is there, else `offline`. */
export function OnAir({ children, offline = null }: { children: ReactNode; offline?: ReactNode }) {
  return client ? children : offline;
}
