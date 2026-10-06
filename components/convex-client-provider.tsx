"use client";

import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
/** One client for the whole tab, made only when there's somewhere to connect. */
const client = url ? new ConvexReactClient(url) : null;

/**
 * Connects its children to Convex. Without a deployment configured it
 * renders `offline` instead, so the rest of the site still works.
 */
export function ConvexClientProvider({ children, offline }: { children: ReactNode; offline: ReactNode }) {
  if (!client) return offline;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
