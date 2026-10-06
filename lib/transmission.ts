import type { ReadingStatus } from "@/lib/content";
import type { Emotion } from "@/lib/emotions";

/** Instruments the station can mount into a reply. */
export const instruments = ["dossier", "tapes", "notes", "game", "transmit", "commands"] as const;
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
};

/** What the station is doing right now; drives the readout and lamps. */
export type StationStatus = "standby" | "receiving" | "printing";

export type ArchiveBook = {
  href: string;
  title: string;
  author?: string;
  bookYear?: number;
  readingStatus?: ReadingStatus;
  summary: string;
};

export type ArchiveNote = {
  href: string;
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
};

export type Archive = {
  books: ArchiveBook[];
  notes: ArchiveNote[];
};

/** Shape of POST /api/chat: plain-text history, newest last. */
export type ChatRequest = {
  history: { from: Transmission["from"]; text: string }[];
};

/** One line of the /api/chat NDJSON stream. */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "meta"; instruments: Instrument[]; emotion: Emotion };

/** The soft keys under the composer, with the phrase each one sends. */
export const softKeys = [
  { key: "1", label: "Who", ask: "Who is Puma?", instrument: "dossier" },
  { key: "2", label: "Notes", ask: "Show me the notes.", instrument: "notes" },
  { key: "3", label: "Tapes", ask: "What are you reading?", instrument: "tapes" },
  { key: "4", label: "Play", ask: "Let's play a game!", instrument: "game" },
  { key: "5", label: "Transmit", ask: "How do I get in touch?", instrument: "transmit" },
  { key: "0", label: "Help", ask: "Help", instrument: "commands" },
] as const satisfies readonly { key: string; label: string; ask: string; instrument: Instrument }[];
