import { siteConfig } from "@/lib/site";

/** The station signs off at 23:00 and back on at 07:00, operator's time. */
const signOff = 23;
const signOn = 7;

/** The hour on the operator's clock, or null when no time zone is set. */
export function operatorHour(at = Date.now()) {
  if (!siteConfig.timeZone) return null;
  const hour = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: siteConfig.timeZone }).format(at);
  return Number(hour) % 24;
}

/**
 * Where the station is in its day: signed off overnight (the operator's
 * asleep, Mr. P's on the night shift), just signed on in the morning, or
 * on air as usual.
 */
export function stationPhase(at = Date.now()): "night" | "morning" | "day" {
  const hour = operatorHour(at);
  if (hour === null) return "day";
  if (hour >= signOff || hour < signOn) return "night";
  if (hour < signOn + 3) return "morning";
  return "day";
}
