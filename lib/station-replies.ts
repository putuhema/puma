import type { Emotion } from "@/lib/emotions";
import type { Archive, Instrument } from "@/lib/transmission";
import { siteConfig } from "@/lib/site";

export type Reply = { text: string; instruments: Instrument[]; emotion: Emotion };

const intents: { pattern: RegExp; reply: (archive: Archive) => Reply }[] = [
  {
    pattern: /\b(channels?|navigat\w*|pages?|sections?|where (can|should) i go|look around|site ?map)\b/,
    reply: () => ({
      text: "Here's the channel guide, earthling! Pick one and I'll tune the set for you. Or just tell me where to go.",
      instruments: ["channels"],
      emotion: "happy",
    }),
  },
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
    pattern: /\b(sanctuary|people|others|someone|community|lonely|room|talk to (other|real))\b/,
    reply: () => ({
      text: "Ooh, the Sanctuary! Channel 03 is a cozy little room where visitors chat with each other live. Pick a name and say hiya, earthling!",
      instruments: ["sanctuary"],
      emotion: "love",
    }),
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

/** Words that name each channel, keyed by its href. */
const channelWords: Record<string, RegExp> = {
  "/": /\b(home|chat|desk|start|main|channel 0?1|ch ?0?1)\b/,
  "/notes": /\b(notes?|writing|channel 0?2|ch ?0?2)\b/,
  "/sanctuary": /\b(sanctuary|room|channel 0?3|ch ?0?3)\b/,
};

/**
 * "Take me to the notes", "go home", "channel 3": where the visitor wants
 * Mr. P to tune the set, or null when they're not asking to go anywhere.
 */
export function destination(question: string) {
  const normalized = question.trim().toLowerCase();
  const going =
    /^(please |can you |could you |let'?s )*(go|take me|bring me|tune|switch|jump|head|navigate|open|back)\b/.test(
      normalized,
    ) || /^(ch(annel)? ?0?[1-3])$/.test(normalized);
  if (!going) return null;
  return siteConfig.navigation.find((item) => channelWords[item.href]?.test(normalized)) ?? null;
}

export function tuningReply(channel: (typeof siteConfig.navigation)[number], here: boolean): Reply {
  return here
    ? {
        text: `We're already on channel 0${channel.shortcut}, ${channel.label}! Look around, earthling.`,
        instruments: [],
        emotion: "laugh",
      }
    : {
        text: `Roger that! Tuning to channel 0${channel.shortcut}, ${channel.label}. Hold onto your antennae!`,
        instruments: [],
        emotion: "excited",
      };
}

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
  text: `Well, hiya there, earthling! I'm Mr. P, ${siteConfig.author}'s host around here. ${siteConfig.author} stepped away from the desk, so you've got me! Just type a question: the operator, the notes, the Sanctuary, anything!`,
  instruments: ["commands"],
  emotion: "excited",
};

/** His hello when poked off the chat, where he floats in the corner. */
export const pocketGreeting: Reply = {
  text: "Hiya, earthling! Need a hand? Pick a channel and I'll tune the set, or ask me anything about the operator.",
  instruments: ["channels"],
  emotion: "happy",
};
