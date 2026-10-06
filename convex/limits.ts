import { ConvexError } from "convex/values";

/** Session ids are random UUIDs minted in the browser. */
export function checkSession(sessionId: string) {
  if (sessionId.length < 8 || sessionId.length > 64) throw new ConvexError("Bad session.");
}

/** Trims a field, caps its length, and insists there's something left. */
export function clean(value: string, max: number, empty: string) {
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, max);
  if (!cleaned) throw new ConvexError(empty);
  return cleaned;
}
