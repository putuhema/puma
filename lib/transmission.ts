import type { Emotion } from "@/lib/emotions";

/** Instruments the station can mount into a reply. */
export const instruments = [
  "dossier",
  "notes",
  "projects",
  "file",
  "now",
  "sanctuary",
  "guestbook",
  "game",
  "transmit",
  "channels",
] as const;
export type Instrument = (typeof instruments)[number];

export type Transmission = {
  id: string;
  from: "visitor" | "station";
  text: string;
  instruments: Instrument[];
  time: string;
  /** False while a streamed reply is still arriving. */
  complete: boolean;
  /** How Mr. P feels about this line (station replies only). */
  emotion?: Emotion;
  /** The note or project the "file" instrument pulls out, by href. */
  entry?: string;
  /** The server's signature on the line, so it can be shared as a still. */
  sig?: string;
};

/** What the station is doing right now; drives the readout and lamps. */
export type StationStatus = "standby" | "receiving" | "printing";

export type ArchiveEntry = {
  href: string;
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  stack: string[];
};

export type Archive = {
  notes: ArchiveEntry[];
  projects: ArchiveEntry[];
};

/** A note or project on file, by its href. */
export function findEntry(archive: Archive, href: string | undefined) {
  if (!href) return undefined;
  return [...archive.projects, ...archive.notes].find((entry) => entry.href === href);
}

/** Shape of POST /api/chat: plain-text history, newest last. */
export type ChatRequest = {
  history: { from: Transmission["from"]; text: string }[];
};

/** One line of the /api/chat NDJSON stream. */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "meta"; instruments: Instrument[]; emotion: Emotion; entry?: string; sig?: string };
