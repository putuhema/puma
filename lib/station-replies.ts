import type { Emotion } from "@/lib/emotions";
import type { Archive, Instrument } from "@/lib/transmission";
import { now, siteConfig } from "@/lib/site";

export type Reply = { text: string; instruments: Instrument[]; emotion: Emotion; entry?: string };

const intents: { pattern: RegExp; reply: (archive: Archive) => Reply }[] = [
  {
    pattern: /\b(channels?|navigat\w*|pages?|sections?|where (can|should) i go|look around|site ?map)\b/,
    reply: () => ({
      text: "The channel guide. Four channels, which is three more than I needed to learn. Pick one and I'll do the tuning.",
      instruments: ["channels"],
      emotion: "happy",
    }),
  },
  {
    pattern: /^(commands?|menu)\b/,
    reply: () => ({
      text: "Type / on the line for the commands, ? for every key, or just ask in plain words. I'm a very advanced alien; full sentences are fine.",
      instruments: [],
      emotion: "happy",
    }),
  },
  {
    pattern: /\b(projects?|work(?! together)|built|build|portfolio|shipped|experience|case stud\w*)\b/,
    reply: ({ projects }) => ({
      text: projects.length
        ? `${projects.length} tape${projects.length === 1 ? "" : "s"} on the shelf. Each one's a project, with what it is, what it's built with, and where to see it. Pick a spine.`
        : "The tape shelf is empty. Projects are being filed, which is what people say when they're being filed. Try the transmitter and ask directly.",
      instruments: ["projects"],
      emotion: projects.length ? "excited" : "sad",
    }),
  },
  {
    pattern: /^now\b|\b(lately|these days|up to|working on|currently)\b/,
    reply: () => ({
      text: `What the operator is up to, as of ${now.updatedAt}. I keep the log; nobody asked me to, it's just that quiet out here.`,
      instruments: ["now"],
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
    pattern: /\b(resume|résumé|cv|recruit\w*|teletext|plain|facts)\b/,
    reply: () => ({
      text: "In a hurry? The teletext page has the plain facts, no alien, no static, and it prints. I'll try not to take it personally.",
      instruments: ["channels"],
      emotion: "wink",
    }),
  },
  {
    pattern: /\b(guest ?book|sign|signature|leave a (note|mark|message))\b/,
    reply: () => ({
      text: "The guestbook. One line, signed, and it stays. Like carving your name into a tree, but the tree is a database.",
      instruments: ["guestbook"],
      emotion: "love",
    }),
  },
  {
    pattern: /\b(record|top score|high ?score|leaderboard|number one)\b/,
    reply: () => ({
      text: "New record on the board. I'd shake your hand, but the helmet makes it awkward. Your initials are up in lights now.",
      instruments: ["game"],
      emotion: "excited",
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
      text: "Star Catcher. Fly my saucer, catch the stars, dodge the rocks. Five in a row gets a multiplier. Want more room? The arcade has the whole screen. Please return the saucer in one piece.",
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
      text: "Hello. Mr. P, interstellar host and part-time website. Ask me about the operator, their projects, or where things are.",
      instruments: [],
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

/** Words that name each place on the station, keyed by its href. */
const channelWords: Record<string, RegExp> = {
  "/": /\b(home|chat|desk|start|main|channel 0?1|ch ?0?1)\b/,
  "/notes": /\b(notes?|writing|channel 0?2|ch ?0?2)\b/,
  "/sanctuary": /\b(sanctuary|room|channel 0?3|ch ?0?3)\b/,
  "/projects": /\b(projects?|work|portfolio|tapes?|shelf|channel 0?4|ch ?0?4)\b/,
  "/guestbook": /\b(guest ?book)\b/,
  "/play": /\b(arcade|game|star catcher|play)\b/,
  "/guide": /\b(tv ?guide|guide|listings|schedule)\b/,
  "/passport": /\b(passport|stickers?|stamps?)\b/,
  "/teletext": /\b(teletext|resume|résumé|cv)\b/,
  "/test-card": /\b(test ?card|colophon|channel 0?0|ch ?0?0)\b/,
};

/** Somewhere Mr. P can tune to: a numbered channel or one of the extras. */
export type Destination = { label: string; href: string; shortcut?: string };

/**
 * "Take me to the notes", "go home", "channel 3": where the visitor wants
 * Mr. P to tune the set, or null when they're not asking to go anywhere.
 */
export function destination(question: string): Destination | null {
  const normalized = question.trim().toLowerCase();
  const going =
    /^(please |can you |could you |let'?s )*(go|take me|bring me|tune|switch|jump|head|navigate|open|back)\b/.test(
      normalized,
    ) || /^(ch(annel)? ?0?[0-4])$/.test(normalized);
  if (!going) return null;
  const places: Destination[] = [...siteConfig.navigation, ...siteConfig.extras];
  return places.find((item) => channelWords[item.href]?.test(normalized)) ?? null;
}

export function tuningReply(place: Destination, here: boolean): Reply {
  const name = place.shortcut ? `channel 0${place.shortcut}, ${place.label}` : `the ${place.label.toLowerCase()}`;
  return here
    ? {
        text: `We're already on ${name}. Mission accomplished, I suppose.`,
        instruments: [],
        emotion: "laugh",
      }
    : {
        text: `Tuning to ${name}. Crossed the galaxy for this, and honestly, worth it.`,
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
    text: "My antennae got nothing, and the big antenna back home is offline. Two antennae, zero answers. Try asking about the operator, the projects or the notes, or type /teach for the tour.",
    instruments: [],
    emotion: "confused",
  };
}

export const bootGreeting: Reply = {
  text: `Hello, earthling. I'm Mr. P, ${siteConfig.author}'s host. ${siteConfig.author} stepped away from the desk, so you get me: smaller, greener-ish, and always available. Ask about the operator, their projects, the notes, the Sanctuary, anything.`,
  instruments: [],
  emotion: "excited",
};

/** Set once the tour has played, so it only greets a visitor's first visit. */
export const touredKey = "puma:toured";

/**
 * The first-visit tour: how to get around, in Mr. P's words. Played once,
 * the first time someone lands on the desk; "help" plays it again.
 */
export const tour: Reply[] = [
  {
    text: "First time on the station? Then let me show you around. Five lines, and I've rehearsed them. Press Enter or Next to go on, or Esc to skip.",
    instruments: [],
    emotion: "excited",
  },
  {
    text: "Talking is easy: type anywhere and it lands on the line at the bottom. Ask about the operator, their projects, their notes. Full sentences welcome; I crossed three galaxies for this.",
    instruments: [],
    emotion: "happy",
  },
  {
    text: "There's no menu bar, so I do the driving. Four channels: Chat, Notes, the Sanctuary and Projects. Alt and a number tunes them, or say \"take me to the projects\" and I'll take you.",
    instruments: ["channels"],
    emotion: "wink",
  },
  {
    text: "Type / for shortcuts. /go goes anywhere, /resume has the plain facts, /play opens the arcade, /effects turns the static off. Press ? for every key on the set.",
    instruments: [],
    emotion: "happy",
  },
  {
    text: "On other pages I wait in the corner. Click me and I'll come along. That's the tour. Type /teach if you want it again; I'll pretend it's the first time.",
    instruments: [],
    emotion: "love",
  },
];

/**
 * His hello, fitted to the moment: a returning visitor mid-read gets their
 * place back, the night shift yawns, the morning has just signed on.
 */
export function greetingFor({
  phase,
  visits,
  reading,
}: {
  phase: "night" | "morning" | "day";
  visits: number;
  reading: { href: string; title: string; progress: number } | null;
}): Reply {
  if (reading && visits > 1) {
    const how = reading.progress < 0.35 ? "just getting into" : reading.progress < 0.65 ? "halfway through" : "nearly done with";
    return {
      text: `Back again. Last time you were ${how} "${reading.title}". I kept your place; the tape's right where you left it.`,
      instruments: ["file"],
      emotion: "love",
      entry: reading.href,
    };
  }
  if (phase === "night") {
    return {
      text: `You've caught the night shift. The station signed off at eleven and ${siteConfig.author} is asleep, so it's just me and the test card. Ask away; I'm awake, technically.`,
      instruments: [],
      emotion: "sleepy",
    };
  }
  if (phase === "morning") {
    return {
      text: `Morning. The station's only just signed on; the coffee is theoretical. I'm Mr. P, ${siteConfig.author}'s host. Ask about the operator, their projects, anything.`,
      instruments: [],
      emotion: "happy",
    };
  }
  if (visits > 1) {
    return {
      text: `Oh, it's you again. Visit number ${visits}; I'm keeping count, it's a small station. What can I find you this time?`,
      instruments: [],
      emotion: "wink",
    };
  }
  return bootGreeting;
}

/** What the line says while it waits, one per turn, so it never gets stale. */
export const linePrompts = [
  "Say hi to Mr. P… (/ for commands, ? for keys, help for the tour)",
  "Ask him anything. He has antennae for this.",
  "Go on, he's all ears. Well, antennae.",
  "Ask about the operator, their projects, or space snacks",
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
