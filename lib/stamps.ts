/**
 * The passport: stickers a visitor earns for exploring the station, kept in
 * this browser only. Earning one fires an event the stamp toast listens for.
 */
export const stamps = [
  { id: "surfer", title: "Channel surfer", hint: "Tune in to all four channels" },
  { id: "toured", title: "Shown around", hint: "Sit through Mr. P's whole tour" },
  { id: "reader", title: "Rolled the credits", hint: "Read a note or project to the end" },
  { id: "player", title: "Saucer licence", hint: "Fly a round of Star Catcher" },
  { id: "board", title: "Up in lights", hint: "Get your initials on the high-score board" },
  { id: "signed", title: "Was here", hint: "Sign the guestbook" },
  { id: "transmitted", title: "On the air", hint: "Send the operator a transmission" },
  { id: "secret", title: "Off the dial", hint: "Find the channel that isn't on the guide" },
] as const;

export type StampId = (typeof stamps)[number]["id"];

const stampsKey = "puma:stamps";
const channelsKey = "puma:channels";
export const stampEvent = "puma-stamp";

export function earnedStamps(): StampId[] {
  try {
    return JSON.parse(window.localStorage.getItem(stampsKey) ?? "[]") as StampId[];
  } catch {
    return [];
  }
}

/** Earn a sticker, once. Returns whether it was new. */
export function awardStamp(id: StampId) {
  if (typeof window === "undefined") return false;
  const earned = earnedStamps();
  if (earned.includes(id)) return false;
  window.localStorage.setItem(stampsKey, JSON.stringify([...earned, id]));
  window.dispatchEvent(new CustomEvent<StampId>(stampEvent, { detail: id }));
  return true;
}

/** Notes a channel visit; all four earns "Channel surfer". */
export function logChannel(href: string, channels: readonly string[]) {
  if (!channels.includes(href)) return;
  let seen: string[] = [];
  try {
    seen = JSON.parse(window.localStorage.getItem(channelsKey) ?? "[]") as string[];
  } catch {}
  if (!seen.includes(href)) {
    seen = [...seen, href];
    window.localStorage.setItem(channelsKey, JSON.stringify(seen));
  }
  if (channels.every((channel) => seen.includes(channel))) awardStamp("surfer");
}
