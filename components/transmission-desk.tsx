"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AsciiSpace } from "@/components/ascii-space";
import { InstrumentMount } from "@/components/instruments";
import { KeyboardMap } from "@/components/keyboard-map";
import { MrP3D, type MrPState } from "@/components/mr-p-3d";
import { useSfx } from "@/components/sound-control";
import { useStation } from "@/components/station-context";
import { useWander } from "@/hooks/use-wander";
import { bootGreeting, localReply, unclearReply } from "@/lib/station-replies";
import {
  type Archive,
  type ChatEvent,
  type ChatRequest,
  type Instrument,
  type Transmission,
} from "@/lib/transmission";

const printTickMs = 16;
/** Long replies speed up so no line takes much more than ~2s to come in. */
const printTicks = 120;
/** A pause before canned replies, so the line still feels like it travels. */
const localDelayMs = 420;

function stamp() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(Date.now());
}

function makeTransmission(
  from: Transmission["from"],
  text: string,
  instruments: Instrument[] = [],
  complete = true,
): Transmission {
  return { id: crypto.randomUUID(), from, text, instruments, time: stamp(), complete };
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"))
  );
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
 * Station text that comes in character by character. While a streamed reply
 * is still arriving it keeps up with the stream, then reports back once the
 * whole line is on screen.
 */
function PrintedText({
  text,
  complete,
  printing,
  onTick,
  onPrinted,
}: {
  text: string;
  complete: boolean;
  printing: boolean;
  onTick: () => void;
  onPrinted: () => void;
}) {
  const [count, setCount] = useState(printing ? 0 : text.length);
  const shownCount = useRef(count);
  const done = useRef(!printing);

  useEffect(() => {
    if (!printing) return;
    const step = Math.max(1, Math.ceil(text.length / printTicks));
    let ticks = 0;
    const timer = window.setInterval(() => {
      if (shownCount.current >= text.length) return;
      if (ticks++ % 3 === 0) onTick();
      shownCount.current = Math.min(text.length, shownCount.current + step);
      setCount(shownCount.current);
    }, printTickMs);
    return () => window.clearInterval(timer);
  }, [onTick, printing, text]);

  // Fast-forwarding (printing turned off early) shows everything received.
  const shown = printing ? count : text.length;
  const finished = complete && shown >= text.length;

  useEffect(() => {
    if (finished && !done.current) {
      done.current = true;
      onPrinted();
    }
  }, [finished, onPrinted]);

  return (
    <p className="font-tube text-[1.375rem] leading-7 sm:text-2xl sm:leading-8">
      <span aria-hidden={!finished}>{text.slice(0, shown)}</span>
      {!finished && (
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-5 w-2.5 translate-y-0.5 animate-lamp bg-foreground shadow-[0_0_8px_var(--foreground)]"
        />
      )}
      {finished ? null : <span className="sr-only">{text}</span>}
    </p>
  );
}

/** Mr. P mulling it over: three dots bobbing in his bubble. */
function ThinkingDots() {
  return (
    <p aria-live="polite" className="flex h-8 items-center gap-2">
      <span className="sr-only">Mr. P is thinking</span>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          aria-hidden="true"
          className="size-2.5 animate-bounce bg-foreground shadow-[0_0_8px_var(--foreground)]"
          style={{ animationDelay: `${dot * 140}ms` }}
        />
      ))}
    </p>
  );
}

/**
 * The portfolio itself: Mr. P floating in ASCII space, waiting to be talked
 * to like an NPC. His speech bubble only pops up over his head once the
 * visitor speaks (or clicks the "!" above him), and only ever holds his
 * current line; the visitor's last words sit by the input. Replies stream in
 * from the model (or the local phrasebook when the antenna is offline) and
 * can mount instruments. Built to be driven from the keyboard: type
 * anywhere, ↑ to recall, Alt+↑ into the latest instrument, Esc to close the
 * bubble, ? for the full map.
 */
export function TransmissionDesk({
  archive,
  initialAsk,
}: {
  archive: Archive;
  initialAsk?: string;
}) {
  const reduceMotion = useReducedMotion();
  const sound = useSfx();
  const { setStatus, screen } = useStation();
  const [log, setLog] = useState<Transmission[]>(() => [
    { ...makeTransmission("station", bootGreeting.text, bootGreeting.instruments), emotion: bootGreeting.emotion },
  ]);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);
  /** Whether his speech bubble is up: only once the visitor talks to him. */
  const [open, setOpen] = useState(false);
  /** Whether he's back at his spot; the bubble waits for him to get there. */
  const [home, setHome] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const flier = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);
  const [draft, setDraft] = useState("");
  const [keymapOpen, setKeymapOpen] = useState(false);
  const antennaOffline = useRef(false);
  const pendingAsk = useRef(initialAsk ?? null);
  const recallIndex = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLElement>(null);
  const streaming = log.some((transmission) => !transmission.complete);
  const busy = receiving || streaming || printingId !== null;
  const mascotState: MrPState = receiving
    ? "thinking"
    : busy
      ? "talking"
      : draft.trim()
        ? "listening"
        : "idle";
  const mascotEmotion =
    [...log].reverse().find((transmission) => transmission.from === "station" && transmission.emotion)?.emotion ??
    "happy";
  const sentLines = log.filter((transmission) => transmission.from === "visitor").map(({ text }) => text);

  useEffect(() => {
    setStatus(receiving ? "receiving" : busy ? "printing" : "standby");
  }, [busy, receiving, setStatus]);

  useEffect(() => () => setStatus("standby"), [setStatus]);

  // A new line from Mr. P: bring him and his bubble back into view.
  const current = [...log].reverse().find((transmission) => transmission.from === "station");
  const lastWords = [...log].reverse().find((transmission) => transmission.from === "visitor");
  const currentId = current?.id;
  useEffect(() => {
    screen.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [currentId, reduceMotion, screen]);

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
      startReply({ ...makeTransmission("station", reply.text, reply.instruments), emotion: reply.emotion });
    },
    [archive, sound, startReply],
  );

  const ask = useCallback(
    async (question: string, viaSoftKey = false) => {
      const text = question.trim();
      if (!text || busy) return;

      sound.send();
      recallIndex.current = -1;
      greeted.current = true;
      setOpen(true);

      if (/^(clear|cls|reset|rewind)$/i.test(text)) {
        const greeting: Transmission = {
          ...makeTransmission("station", "Rewound and ready! Fresh tape, fresh start. What'll it be?", ["commands"]),
          emotion: "excited",
        };
        setLog([greeting]);
        setPrintingId(reduceMotion ? null : greeting.id);
        return;
      }

      const visitor = makeTransmission("visitor", text);
      const history = [...log, visitor];
      setLog(history);
      setReceiving(true);

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
              `Whoa, slow down, space cadet! My antennae are all frazzled. Give me ${wait} second${wait === 1 ? "" : "s"} to cool off, then ask me again.`,
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
                  ? { ...item, instruments: event.instruments, emotion: event.emotion, complete: true }
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
    [busy, deliverLocal, log, reduceMotion, sound, startReply],
  );

  const finishPrinting = useCallback((transmission: Transmission) => {
    setPrintingId((current) => (current === transmission.id ? null : current));
  }, []);

  /** Walk up to him: the bubble pops up, with his hello the first time. */
  const talk = useCallback(() => {
    sound.key();
    setOpen(true);
    if (!greeted.current) {
      greeted.current = true;
      const greeting = [...log].reverse().find((transmission) => transmission.from === "station");
      setPrintingId(reduceMotion || !greeting ? null : greeting.id);
    }
    input.current?.focus();
  }, [log, reduceMotion, sound]);

  const close = useCallback(() => {
    setOpen(false);
    setPrintingId(null);
    input.current?.focus();
  }, []);

  // A question carried in the URL (?ask=…) goes out once the greeting is done.
  useEffect(() => {
    if (busy || !pendingAsk.current) return;
    const timer = window.setTimeout(() => {
      const queued = pendingAsk.current;
      pendingAsk.current = null;
      if (queued) void ask(queued, true);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [ask, busy]);

  const focusLatestInstrument = useCallback(() => {
    const instruments = transcript.current?.querySelectorAll<HTMLElement>("[data-instrument]");
    const latest = instruments?.[instruments.length - 1];
    const target =
      latest?.querySelector<HTMLElement>("a[href], button, input, textarea, [tabindex='0']") ?? latest;
    target?.focus();
    return Boolean(target);
  }, []);

  // Keyboard first: type anywhere, soft keys on an empty line, ? for the map.
  useEffect(() => {
    function operateDesk(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      const onLine = event.target === input.current;
      const typing = isTypingTarget(event.target);
      const emptyLine = (onLine && draft === "") || !typing;

      if (event.key === "Escape") {
        if (keymapOpen) {
          setKeymapOpen(false);
          event.preventDefault();
        } else if (printingId) {
          setPrintingId(null);
          event.preventDefault();
        } else if (!onLine && transcript.current?.contains(event.target as Node)) {
          input.current?.focus();
          event.preventDefault();
        } else if (open && !receiving && (emptyLine || !typing)) {
          close();
          event.preventDefault();
        }
        return;
      }

      if (event.altKey) {
        if (event.key === "ArrowUp" && focusLatestInstrument()) event.preventDefault();
        return;
      }

      if (emptyLine && event.key === "?") {
        event.preventDefault();
        setKeymapOpen((open) => !open);
        return;
      }

      if (event.key === "/" && !typing) {
        event.preventDefault();
        input.current?.focus();
        return;
      }

      // Any other printable key lands on the line, wherever focus was.
      if (!typing && event.key.length === 1 && event.key !== " ") {
        input.current?.focus();
      }
    }

    window.addEventListener("keydown", operateDesk);
    return () => window.removeEventListener("keydown", operateDesk);
  }, [ask, close, draft, focusLatestInstrument, keymapOpen, open, printingId, receiving]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    void ask(draft);
    setDraft("");
  }

  function operateLine(event: ReactKeyboardEvent<HTMLInputElement>) {
    // ↑ / ↓ recall earlier transmissions, like a shell.
    if ((event.key === "ArrowUp" || event.key === "ArrowDown") && sentLines.length > 0 && !event.altKey) {
      const recalling = recallIndex.current >= 0;
      if (event.key === "ArrowUp" && (draft === "" || recalling)) {
        event.preventDefault();
        recallIndex.current = Math.min(sentLines.length - 1, recallIndex.current + 1);
        setDraft(sentLines[sentLines.length - 1 - recallIndex.current]);
      } else if (event.key === "ArrowDown" && recalling) {
        event.preventDefault();
        recallIndex.current -= 1;
        setDraft(recallIndex.current >= 0 ? sentLines[sentLines.length - 1 - recallIndex.current] : "");
      }
    }
  }

  const isPrinting = current?.id === printingId;
  const showInstruments =
    current && current.complete && !isPrinting && !receiving && current.instruments.length > 0;
  const lineDone = current && current.complete && !isPrinting && !receiving;
  /** Showing something hands-on (a file, the scope, a game) rather than just talk. */
  const showcase = showInstruments && current.instruments.some((instrument) => instrument !== "commands");

  // Left alone, he plays around the stage; talk to him (or start typing) and
  // he flies back to answer.
  useWander(flier, {
    roaming: !open && !busy && !draft.trim(),
    area: () => {
      const bounds = stage.current!.getBoundingClientRect();
      return { left: bounds.left + 8, top: bounds.top + 8, right: bounds.right - 8, bottom: bounds.bottom - 4 };
    },
    onSettle: () => setHome(true),
    onDepart: () => setHome(false),
  });

  return (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col">
      <AsciiSpace className="absolute inset-0 size-full" />
      <h1 className="sr-only">Talk to Mr. P</h1>

      {/* Deep space: Mr. P floats low and centre, the bubble pops up over him. */}
      <div ref={stage} className="relative flex flex-1 flex-col items-center justify-end px-3 pt-6 pb-2 sm:px-6">
        <div className="relative">
          <AnimatePresence>
            {open && home && (
              /* His speech bubble, over his head. Click it (or Esc) to skip ahead. */
              <motion.section
                key="bubble"
                ref={transcript}
                aria-label="Mr. P says"
                aria-live="polite"
                onClick={() => printingId && setPrintingId(null)}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 20, transition: { duration: 0.15 } }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.35 }}
                className="absolute bottom-[calc(100%-3rem)] left-1/2 z-10 w-[min(42rem,calc(100vw-1.5rem))] origin-bottom -translate-x-1/2 sm:bottom-[calc(100%-4rem)]"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={receiving ? "thinking" : (current?.id ?? "empty")}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0.3 }}
                    className="relative origin-bottom"
                  >
                    {/* The tail points down at Mr. P. */}
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-[11px] left-1/2 size-5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-foreground bg-surface"
                    />
                    <div className="border-2 border-foreground bg-surface px-5 pt-6 pb-5 shadow-[6px_6px_0_var(--osd)] sm:px-7 sm:pt-7">
                      <p className="type-label absolute -top-3 left-4 bg-osd px-2 py-1 text-osd-foreground sm:left-6">
                        Mr. P
                      </p>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          close();
                        }}
                        className="type-label absolute -top-3 right-4 border border-foreground bg-surface px-2 py-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground sm:right-6"
                      >
                        <span aria-hidden="true">✕ Esc</span>
                        <span className="sr-only">Close</span>
                      </button>

                      <div className="max-h-[calc(100dvh-29rem)] min-h-8 overflow-y-auto overscroll-contain [scrollbar-width:thin] sm:max-h-[calc(100dvh-32rem)]">
                        {receiving || !current ? (
                          <ThinkingDots />
                        ) : (
                          <PrintedText
                            key={current.id}
                            text={current.text}
                            complete={current.complete}
                            printing={isPrinting}
                            onTick={sound.blip}
                            onPrinted={() => finishPrinting(current)}
                          />
                        )}

                        {showInstruments && (
                          <div className="mt-5 flex flex-col gap-5">
                            {current.instruments.map((instrument) => (
                              <div key={instrument} data-instrument={instrument}>
                                <InstrumentMount
                                  instrument={instrument}
                                  archive={archive}
                                  onAsk={(question) => void ask(question, true)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* The classic "more" cursor once he's said his piece. */}
                      {lineDone && !showcase && (
                        <span
                          aria-hidden="true"
                          className="absolute right-3 bottom-1 animate-bounce font-tube text-xl leading-none text-signal"
                        >
                          ▼
                        </span>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Mr. P, adrift: plays around the stage until he's needed, then flies
              back here. Follows the pointer, reacts to the conversation. */}
          <div ref={flier} className="relative will-change-transform">
            <AnimatePresence>
              {!open && (
                /* Like an NPC with something to say: a "!" bobbing over his head. */
                  <motion.button
                    key="talk"
                    type="button"
                    onClick={talk}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.1 } }}
                    className="group absolute bottom-[calc(100%-1rem)] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 outline-none"
                  >
                    <span className="flex size-10 animate-bounce items-center justify-center border-2 border-foreground bg-signal font-tube text-3xl leading-none text-background shadow-[3px_3px_0_var(--osd)] group-hover:bg-foreground group-focus-visible:bg-foreground">
                      !
                    </span>
                    <span className="type-label bg-background/80 px-1.5 py-0.5 text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground">
                      Talk
                    </span>
                  </motion.button>
              )}
            </AnimatePresence>
            <MrP3D
              state={mascotState}
              emotion={mascotEmotion}
              className="block h-64 w-60 sm:h-80 sm:w-80"
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-rule bg-background px-2 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6 lg:px-10">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-3">
          {open && lastWords && (
            <p className="type-osd flex min-w-0 items-baseline gap-2 text-sm">
              <span className="type-label shrink-0 text-muted-foreground">You said</span>
              <span className="truncate bg-osd px-2 py-0.5 text-osd-foreground [text-shadow:none]">
                {lastWords.text}
              </span>
            </p>
          )}

          <form onSubmit={submit} className="flex items-stretch gap-2">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-2 border bg-surface px-3 focus-within:border-osd focus-within:ring-2 focus-within:ring-osd/30">
              <span aria-hidden="true" className="font-semibold text-osd">
                ▸
              </span>
              <span className="sr-only">Say something to Mr. P</span>
              <input
                ref={input}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  recallIndex.current = -1;
                }}
                onKeyDown={operateLine}
                maxLength={500}
                autoComplete="off"
                autoFocus
                placeholder={busy ? "Mr. P is talking…" : "Say something to Mr. P… (? for keys)"}
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <span aria-hidden="true" className="type-label shrink-0 text-muted-foreground">
                ⏎
              </span>
            </label>
          </form>
        </div>
      </div>

      {keymapOpen && <KeyboardMap onClose={() => setKeymapOpen(false)} />}
    </div>
  );
}
