import type { Emotion } from "@/lib/emotions";
import type { Archive, Instrument } from "@/lib/transmission";
import { siteConfig } from "@/lib/site";

export type Reply = { text: string; instruments: Instrument[]; emotion: Emotion };

const intents: { pattern: RegExp; reply: (archive: Archive) => Reply }[] = [
  {
    pattern: /\b(channels?|navigat\w*|pages?|sections?|where (can|should) i go|look around|site ?map)\b/,
    reply: () => ({
      text: "The channel guide. Three channels, which is two more than I needed to learn. Pick one and I'll do the tuning.",
      instruments: ["channels"],
      emotion: "happy",
    }),
  },
  {
    pattern: /^(help|\?|commands?|menu)\b/,
    reply: () => ({
      text: "Here's the menu. Pick a branch, or type a question in plain words. I'm a very advanced alien; full sentences are fine.",
      instruments: ["commands"],
      emotion: "happy",
    }),
  },
  {
    pattern: /\b(who|about|puma|operator|yourself|bio)\b/,
    reply: () => ({
      text: `The file on ${siteConfig.author}: ${siteConfig.description.toLowerCase()} Currently away from the desk, which is how I got this job. I didn't apply.`,
      instruments: ["dossier"],
      emotion: "love",
    }),
  },
  {
    pattern: /\b(notes?|writing|thoughts?)\b/,
    reply: ({ notes }) => ({
      text: notes.length
        ? `${notes.length} note${notes.length === 1 ? "" : "s"} on the tracking scope. Pick a contact and I'll roll the tape. I've read them all; no spoilers.`
        : "Tracking scope's empty. No notes filed yet. The operator is \"thinking about it,\" which is a phase I'm told can last years.",
      instruments: ["notes"],
      emotion: notes.length ? "excited" : "sad",
    }),
  },
  {
    pattern: /\b(sanctuary|people|others|someone|community|lonely|room|talk to (other|real))\b/,
    reply: () => ({
      text: "Channel 03, the Sanctuary. Real humans, talking live, to each other. Revolutionary. Pick a name and say hello; I'll pretend not to listen.",
      instruments: ["sanctuary"],
      emotion: "love",
    }),
  },
  {
    pattern: /\bscored (\d+)/,
    reply: () => ({
      text: "Not bad. You fly that saucer better than I do, and I was born in one. I'll be updating my résumé. Again?",
      instruments: [],
      emotion: "excited",
    }),
  },
  {
    pattern: /\b(game|play|bored|fun|stars?)\b/,
    reply: () => ({
      text: "Star Catcher. Fly my saucer, catch the stars, dodge the rocks. Five in a row gets a multiplier. Please return the saucer in one piece.",
      instruments: ["game"],
      emotion: "excited",
    }),
  },
  {
    pattern: /\b(contact|email|mail|hire|reach|touch|transmit|work together)\b/,
    reply: () => ({
      text: "Transmitter's warm. Write your message and it goes straight to the operator's inbox. Faster than a carrier pigeon, slightly less dignified.",
      instruments: ["transmit"],
      emotion: "happy",
    }),
  },
  {
    pattern: /^(hi|hello|hey|yo|good (morning|evening|afternoon))\b/,
    reply: () => ({
      text: "Hello. Mr. P, interstellar host and part-time website. Ask me about the operator, or start with the menu.",
      instruments: ["commands"],
      emotion: "wink",
    }),
  },
  {
    pattern: /\b(sudo|self.?destruct|launch|nuke)\b/,
    reply: () => ({
      text: "Bold. Unfortunately this station runs on curiosity, not authority. Also I don't have the keys.",
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
        text: `We're already on channel 0${channel.shortcut}, ${channel.label}. Mission accomplished, I suppose.`,
        instruments: [],
        emotion: "laugh",
      }
    : {
        text: `Tuning to channel 0${channel.shortcut}, ${channel.label}. Crossed the galaxy for this, and honestly, worth it.`,
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
    text: "My antennae got nothing, and the big antenna back home is offline. Two antennae, zero answers. Try one of these.",
    instruments: ["commands"],
    emotion: "confused",
  };
}

export const bootGreeting: Reply = {
  text: `Hello, earthling. I'm Mr. P, ${siteConfig.author}'s host. ${siteConfig.author} stepped away from the desk, so you get me: smaller, greener-ish, and always available. Ask about the operator, the notes, the Sanctuary, anything.`,
  instruments: ["commands"],
  emotion: "excited",
};

/** What the line says while it waits, one per turn, so it never gets stale. */
export const linePrompts = [
  "Say hi to Mr. P… (? for keys)",
  "Ask him anything. He has antennae for this.",
  "Go on, he's all ears. Well, antennae.",
  "Ask about the operator, the notes, or space snacks",
  "Type here. He reads fast for an alien.",
];

/** What the line says while he's still mid-sentence. */
export const busyPrompts = ["Mr. P is talking…", "Hang on, he's on a roll…", "Let him finish, he's proud of this one…"];

/** His hello when poked off the chat, where he floats in the corner. */
export const pocketGreeting: Reply = {
  text: "Lost? Happens to the best of us. I once took a wrong turn at Jupiter. Pick a channel, or ask me about the operator.",
  instruments: ["channels"],
  emotion: "happy",
};
