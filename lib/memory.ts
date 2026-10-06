/**
 * What Mr. P remembers about a visitor between visits, kept in this browser:
 * how many times they've dropped by, and the last thing they were reading.
 */
const visitsKey = "puma:visits";
const readingKey = "puma:reading";

export type Reading = { href: string; title: string; progress: number };

/** Counts this visit (once per tab session) and returns the total. */
export function countVisit() {
  const counted = window.sessionStorage.getItem(visitsKey);
  const visits = Number(window.localStorage.getItem(visitsKey) ?? 0) + (counted ? 0 : 1);
  if (!counted) {
    window.sessionStorage.setItem(visitsKey, "1");
    window.localStorage.setItem(visitsKey, String(visits));
  }
  return visits;
}

export function rememberReading(reading: Reading) {
  window.localStorage.setItem(readingKey, JSON.stringify(reading));
}

export function forgetReading(href: string) {
  if (lastReading()?.href === href) window.localStorage.removeItem(readingKey);
}

export function lastReading(): Reading | null {
  try {
    return JSON.parse(window.localStorage.getItem(readingKey) ?? "null") as Reading | null;
  } catch {
    return null;
  }
}

/** How many visits so far, without counting one. */
export function visitCount() {
  return Number(window.localStorage.getItem(visitsKey) ?? 0);
}
