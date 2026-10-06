"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import type { MrPState } from "@/components/mr-p-3d";
import { useSfx } from "@/components/sound-control";
import { destination, localReply, tuningReply, unclearReply, type Reply } from "@/lib/station-replies";
import type { Archive, ChatEvent, ChatRequest, Instrument, Transmission } from "@/lib/transmission";

/** A pause before canned replies, so the line still feels like it travels. */
const localDelayMs = 420;
/** Long enough to read "tuning to…" before the channel changes. */
const tuningDelayMs = 1200;

function stamp() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(Date.now());
}

export function makeTransmission(
  from: Transmission["from"],
  text: string,
  instruments: Instrument[] = [],
  complete = true,
): Transmission {
  return { id: crypto.randomUUID(), from, text, instruments, time: stamp(), complete };
}

/** Reads /api/chat's NDJSON stream, one event per line. */
async function* readEvents(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) yield JSON.parse(line) as ChatEvent;
    }
  }
}

/**
 * A conversation with Mr. P: the log, his current line and how it prints,
 * and `ask`, which streams a reply from the model (or the local phrasebook
 * when the antenna is offline or a soft key was pressed). Shared by the
 * desk on the home page and the pocket chat everywhere else.
 */
export function useConversation({ archive, greeting }: { archive: Archive; greeting: Reply }) {
  const reduceMotion = useReducedMotion();
  const sound = useSfx();
  const router = useRouter();
  const pathname = usePathname();
  const [log, setLog] = useState<Transmission[]>(() => [
    { ...makeTransmission("station", greeting.text, greeting.instruments), emotion: greeting.emotion },
  ]);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);
  const antennaOffline = useRef(false);

  const streaming = log.some((transmission) => !transmission.complete);
  const busy = receiving || streaming || printingId !== null;
  const current = [...log].reverse().find((transmission) => transmission.from === "station");
  const lastWords = [...log].reverse().find((transmission) => transmission.from === "visitor");
  const sentLines = log.filter((transmission) => transmission.from === "visitor").map(({ text }) => text);
  const emotion =
    [...log].reverse().find((transmission) => transmission.from === "station" && transmission.emotion)?.emotion ??
    "happy";
  const isPrinting = current !== undefined && current.id === printingId;
  /** He's said his piece: the whole line is in and on screen. */
  const lineDone = Boolean(current && current.complete && !isPrinting && !receiving);
  const instruments = lineDone && current ? current.instruments : [];

  /** How he should act, given what the visitor is typing. */
  const mascotState = (draft: string): MrPState =>
    receiving ? "thinking" : busy ? "talking" : draft.trim() ? "listening" : "idle";

  const startReply = useCallback(
    (reply: Transmission) => {
      setReceiving(false);
      setLog((current) => [...current, reply]);
      setPrintingId(reduceMotion ? null : reply.id);
    },
    [reduceMotion],
  );

  const deliverLocal = useCallback(
    (question: string) => {
      const reply = localReply(question, archive) ?? unclearReply();
      if (!localReply(question, archive)) sound.error();
      startReply({
        ...makeTransmission("station", reply.text, reply.instruments),
        emotion: reply.emotion,
        entry: reply.entry,
      });
    },
    [archive, sound, startReply],
  );

  const ask = useCallback(
    async (question: string, viaSoftKey = false) => {
      const text = question.trim();
      if (!text || busy) return;
      sound.send();

      if (/^(clear|cls|reset|rewind)$/i.test(text)) {
        const fresh: Transmission = {
          ...makeTransmission("station", "Tape rewound. I've forgotten everything, which is very relaxing. What now?"),
          emotion: "excited",
        };
        setLog([fresh]);
        setPrintingId(reduceMotion ? null : fresh.id);
        return;
      }

      const visitor = makeTransmission("visitor", text);
      const history = [...log, visitor];
      setLog(history);
      setReceiving(true);

      // "Take me to the notes": he answers, then tunes the set himself.
      const channel = destination(text);
      if (channel) {
        const here = channel.href === pathname;
        const reply = tuningReply(channel, here);
        window.setTimeout(() => {
          startReply({ ...makeTransmission("station", reply.text), emotion: reply.emotion });
          if (!here) window.setTimeout(() => router.push(channel.href), tuningDelayMs);
        }, localDelayMs);
        return;
      }

      if (viaSoftKey || antennaOffline.current) {
        window.setTimeout(() => deliverLocal(text), localDelayMs);
        return;
      }

      const reply = makeTransmission("station", "", [], false);
      let started = false;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history: history.map(({ from, text }) => ({ from, text })),
          } satisfies ChatRequest),
        });

        if (response.status === 429) {
          // Rate limited: he needs a breather, and says so, rather than faking a reply.
          const { retryAfter } = (await response.json().catch(() => ({}))) as { retryAfter?: number };
          const wait = Math.max(1, Math.ceil(retryAfter ?? 60));
          sound.error();
          startReply({
            ...makeTransmission(
              "station",
              `Easy. My antennae need ${wait} second${wait === 1 ? "" : "s"} to cool down. Alien hardware, Earth budget.`,
            ),
            emotion: "dizzy",
          });
          return;
        }

        if (!response.ok || !response.body) {
          antennaOffline.current = response.status === 503;
          throw new Error(`antenna ${response.status}`);
        }

        for await (const event of readEvents(response.body)) {
          if (event.type === "text") {
            if (!started) {
              started = true;
              sound.receive();
              startReply(reply);
            }
            setLog((current) =>
              current.map((item) => (item.id === reply.id ? { ...item, text: item.text + event.text } : item)),
            );
          } else if (started) {
            setLog((current) =>
              current.map((item) =>
                item.id === reply.id
                  ? {
                      ...item,
                      instruments: event.instruments,
                      emotion: event.emotion,
                      entry: event.entry,
                      complete: true,
                    }
                  : item,
              ),
            );
          }
        }

        if (!started) throw new Error("empty transmission");
      } catch {
        if (started) {
          // Signal dropped mid-reply: keep what arrived and close the line.
          setLog((current) =>
            current.map((item) => (item.id === reply.id ? { ...item, complete: true } : item)),
          );
          return;
        }
        deliverLocal(text);
      }
    },
    [busy, deliverLocal, log, pathname, reduceMotion, router, sound, startReply],
  );

  /** A line from Mr. P that nobody asked for: the tour, say. */
  const say = useCallback(
    (reply: Reply) =>
      startReply({ ...makeTransmission("station", reply.text, reply.instruments), emotion: reply.emotion }),
    [startReply],
  );

    const finishPrinting = useCallback((transmission: Transmission) => {
    setPrintingId((current) => (current === transmission.id ? null : current));
  }, []);

  /** Print his current line from the start (his hello, when first approached). */
  const replayCurrent = useCallback(() => {
    if (current && !reduceMotion) setPrintingId(current.id);
  }, [current, reduceMotion]);

  /** Show the whole line at once. */
  const skip = useCallback(() => setPrintingId(null), []);

  return {
    log,
    current,
    lastWords,
    sentLines,
    receiving,
    busy,
    printingId,
    isPrinting,
    lineDone,
    instruments,
    emotion,
    mascotState,
    ask,
    say,
    finishPrinting,
    replayCurrent,
    skip,
  };
}
