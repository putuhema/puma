/**
 * A small sliding-window rate limiter, kept in memory. Each server instance
 * counts on its own, so on a fleet of serverless instances it is a speed
 * bump rather than a wall; it still stops one visitor from hammering the
 * model from a single tab.
 */

type Window = { limit: number; ms: number };

const hits = new Map<string, number[]>();
let lastSweep = 0;

/** Forget visitors who have gone quiet, so the map doesn't grow forever. */
function sweep(now: number, longest: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, times] of hits) {
    if (!times.length || now - times[times.length - 1] > longest) hits.delete(key);
  }
}

/**
 * Records a hit for `key` if every window has room. Returns how many seconds
 * to wait when it doesn't.
 */
export function rateLimit(key: string, windows: Window[]): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const longest = Math.max(...windows.map((window) => window.ms));
  sweep(now, longest);

  const times = (hits.get(key) ?? []).filter((time) => now - time < longest);
  for (const { limit, ms } of windows) {
    const recent = times.filter((time) => now - time < ms);
    if (recent.length >= limit) {
      // Room opens up when the oldest hit in this window ages out.
      const retryAfter = Math.ceil((recent[recent.length - limit] + ms - now) / 1000);
      hits.set(key, times);
      return { ok: false, retryAfter: Math.max(1, retryAfter) };
    }
  }

  times.push(now);
  hits.set(key, times);
  return { ok: true };
}

/** The caller's address, as reported by the proxy in front of us. */
export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
