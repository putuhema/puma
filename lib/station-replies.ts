import type { Emotion } from "@/lib/emotions";
import type { Archive, Instrument } from "@/lib/transmission";
import { siteConfig } from "@/lib/site";

type Reply = { text: string; instruments: Instrument[]; emotion: Emotion };

const intents: { pattern: RegExp; reply: (archive: Archive) => Reply }[] = [
  {
    pattern: /^(help|\?|commands?|menu)\b/,
    reply: () => ({
      text: "Well, here's the whole menu, folks! Type any question in plain words, press a soft key, or pick a branch below.",
      instruments: ["commands"],
      emotion: "happy",
    }),
  },
  {
    pattern: /\b(who|about|puma|operator|yourself|bio)\b/,
    reply: () => ({
      text: `Ah, the boss! Here's the file on ${siteConfig.author}: ${siteConfig.description.toLowerCase()} They're away from the desk, so yours truly keeps the station humming.`,
      instruments: ["dossier"],
      emotion: "love",
    }),
  },
  {
    pattern: /\b(notes?|writing|thoughts?)\b/,
    reply: ({ notes }) => ({
      text: notes.length
        ? `Ooh, ${notes.length} note${notes.length === 1 ? "" : "s"} on the tracking scope! Pick a contact and I'll roll the tape.`
        : "Tracking scope's clear as a summer sky! No notes filed yet. The operator's still scribbling away.",
      instruments: ["notes"],
      emotion: notes.length ? "excited" : "sad",
    }),
  },
  {
    pattern: /\b(books?|read(ing)?|tapes?|library|shelf)\b/,
    reply: ({ books }) => {
      const current = books.find((book) => book.readingStatus === "reading");
      return {
        text: current
          ? `Now playing: ${current.title} by ${current.author}! ${books.length} tape${books.length === 1 ? "" : "s"} in the library, all rewound for you.`
          : `${books.length} tape${books.length === 1 ? "" : "s"} in the library, all rewound for you! Pick one and I'll play the review.`,
        instruments: ["tapes"],
      emotion: "excited",
      };
    },
  },
  {
    pattern: /\bscored (\d+)/,
    reply: () => ({
      text: "Woweee, look at that score! You fly that saucer better than I do, and I was born in one. Wanna go again, or ask me something?",
      instruments: [],
      emotion: "excited",
    }),
  },
  {
    pattern: /\b(game|play|bored|fun|stars?)\b/,
    reply: () => ({
      text: "Ooh, Star Catcher! Fly my saucer, catch the falling stars, and dodge those pesky rocks. Catch five in a row for a multiplier!",
      instruments: ["game"],
      emotion: "excited",
    }),
  },
  {
    pattern: /\b(contact|email|mail|hire|reach|touch|transmit|work together)\b/,
    reply: () => ({
      text: "Swell! Warming up the transmitter. Write your message and it flies straight to the operator's inbox.",
      instruments: ["transmit"],
      emotion: "happy",
    }),
  },
  {
    pattern: /^(hi|hello|hey|yo|good (morning|evening|afternoon))\b/,
    reply: () => ({
      text: "Well, hiya there! Mr. P at your service. Ask me anything about the operator, or start with the menu.",
      instruments: ["commands"],
      emotion: "wink",
    }),
  },
  {
    pattern: /\b(sudo|self.?destruct|launch|nuke)\b/,
    reply: () => ({
      text: "Ha! Nice try, pal. This station runs on curiosity, not authority.",
      instruments: [],
      emotion: "laugh",
    }),
  },
];

/** The station's own phrasebook. Returns null when nothing matches. */
export function localReply(question: string, archive: Archive): Reply | null {
  const normalized = question.trim().toLowerCase();
  const intent = intents.find(({ pattern }) => pattern.test(normalized));
  return intent ? intent.reply(archive) : null;
}

export function unclearReply(): Reply {
  return {
    text: "Gee, my antennae aren't picking that one up, and the big antenna back home is offline today. Try one of these instead!",
    instruments: ["commands"],
    emotion: "confused",
  };
}

export const bootGreeting: Reply = {
  text: `Well, hiya there, earthling! I'm Mr. P, ${siteConfig.author}'s host around here. ${siteConfig.author} stepped away from the desk, so you've got me! Just type a question: the operator, the notes, the tapes, anything!`,
  instruments: ["commands"],
  emotion: "excited",
};
