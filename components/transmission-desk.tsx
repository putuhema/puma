"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AsciiSpace } from "@/components/ascii-space";
import { InstrumentMount } from "@/components/instruments";
import { KeyboardMap } from "@/components/keyboard-map";
import { MrP3D } from "@/components/mr-p-3d";
import { useSfx } from "@/components/sound-control";
import { PrintedText, ThinkingDots } from "@/components/speech";
import { useStation } from "@/components/station-context";
import { useConversation } from "@/hooks/use-conversation";
import { useWander } from "@/hooks/use-wander";
import { bootGreeting } from "@/lib/station-replies";
import { softKeys, type Archive } from "@/lib/transmission";

/** The menu that rings Mr. P: the soft keys, plus a way to the other channels. */
const ringOptions = [
  ...softKeys.filter((softKey) => softKey.instrument !== "commands"),
  { key: "6", label: "Channels", ask: "Show me the channels." },
];

/** Where each option sits around him, in degrees (0 is his right, 90 below). */
const ringAngles = [-150, 180, 150, 30, 0, -30];

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"))
  );
}

/**
 * The portfolio itself: Mr. P floating in ASCII space, waiting to be talked
 * to like an NPC. His speech bubble only pops up over his head once the
 * visitor speaks (or clicks him), and only ever holds his current line;
 * clicking the empty space around him calls him home with a ring of menu
 * options; the visitor's last words sit by the input. Replies stream in
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
  const conversation = useConversation({ archive, greeting: bootGreeting });
  const { current, lastWords, sentLines, receiving, busy, printingId, isPrinting, lineDone, finishPrinting } =
    conversation;
  /** Whether his speech bubble is up: only once the visitor talks to him. */
  const [open, setOpen] = useState(false);
  /** Whether he's back at his spot; the bubble waits for him to get there. */
  const [home, setHome] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const flier = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);
  const [draft, setDraft] = useState("");
  const [keymapOpen, setKeymapOpen] = useState(false);
  /** Whether the ring of options is out around him. */
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingAsk = useRef(initialAsk ?? null);
  const recallIndex = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLElement>(null);

  useEffect(() => {
    setStatus(receiving ? "receiving" : busy ? "printing" : "standby");
  }, [busy, receiving, setStatus]);

  useEffect(() => () => setStatus("standby"), [setStatus]);

  // A new line from Mr. P: bring him and his bubble back into view.
  const currentId = current?.id;
  useEffect(() => {
    screen.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [currentId, reduceMotion, screen]);

  const { ask: send, replayCurrent, skip } = conversation;
  const ask = useCallback(
    (question: string, viaSoftKey = false) => {
      if (!question.trim() || busy) return;
      recallIndex.current = -1;
      greeted.current = true;
      setMenuOpen(false);
      setOpen(true);
      void send(question, viaSoftKey);
    },
    [busy, send],
  );

  /** Walk up to him: the bubble pops up, with his hello the first time. */
  const talk = useCallback(() => {
    sound.key();
    setOpen(true);
    if (!greeted.current) {
      greeted.current = true;
      replayCurrent();
    }
    input.current?.focus();
  }, [replayCurrent, sound]);

  /** Clicking him: his bubble pops up, or goes away. */
  const poke = useCallback(() => {
    if (!open) return talk();
    setOpen(false);
    skip();
  }, [open, skip, talk]);

  /** Clicking the empty space: the menu rings him, or folds away. */
  function toggleMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a, input, textarea, [data-instrument], section")) return;
    sound.key();
    setMenuOpen((menu) => !menu);
  }

  const close = useCallback(() => {
    setOpen(false);
    skip();
    input.current?.focus();
  }, [skip]);

  // A question carried in the URL (?ask=…) goes out once the greeting is done.
  useEffect(() => {
    if (busy || !pendingAsk.current) return;
    const timer = window.setTimeout(() => {
      const queued = pendingAsk.current;
      pendingAsk.current = null;
      if (queued) ask(queued, true);
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
        } else if (menuOpen) {
          setMenuOpen(false);
          event.preventDefault();
        } else if (printingId) {
          skip();
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
  }, [close, draft, focusLatestInstrument, keymapOpen, menuOpen, open, printingId, receiving, skip]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    ask(draft);
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

  /** Showing something hands-on (a file, the scope, a game) rather than just talk. */
  const showcase = conversation.instruments.some((instrument) => instrument !== "commands");

  // Left alone, he plays around the stage; talk to him (or start typing) and
  // he flies back to answer.
  useWander(flier, {
    roaming: !open && !menuOpen && !busy && !draft.trim(),
    area: () => {
      const bounds = stage.current!.getBoundingClientRect();
      return { left: bounds.left + 8, top: bounds.top + 8, right: bounds.right - 8, bottom: bounds.bottom - 4 };
    },
    onSettle: () => setHome(true),
    onDepart: () => setHome(false),
  });

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <AsciiSpace className="absolute inset-0 size-full" />
      <h1 className="sr-only">Talk to Mr. P</h1>

      {/* Deep space: Mr. P floats low and centre, the bubble pops up over him. */}
      <div ref={stage} onClick={toggleMenu} className="relative flex flex-1 flex-col items-center justify-end px-3 pt-6 pb-2 sm:px-6">
        <div className="relative">
          <AnimatePresence>
            {open && home && (
              /* His speech bubble, over his head. Click it (or Esc) to skip ahead. */
              <motion.section
                key="bubble"
                ref={transcript}
                aria-label="Mr. P says"
                aria-live="polite"
                onClick={() => printingId && skip()}
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

                        {conversation.instruments.length > 0 && (
                          <div className="mt-5 flex flex-col gap-5">
                            {conversation.instruments.map((instrument) => (
                              <div key={instrument} data-instrument={instrument}>
                                <InstrumentMount
                                  instrument={instrument}
                                  archive={archive}
                                  onAsk={(question) => ask(question, true)}
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
              {menuOpen && home && (
                /* The menu rings him, popping out from his middle. */
                <motion.nav
                  key="ring"
                  aria-label="Things to say"
                  className="pointer-events-none absolute inset-0 z-20 [--ring:9rem] sm:[--ring:13rem]"
                >
                  {ringOptions.map((option, index) => {
                    const angle = (ringAngles[index] * Math.PI) / 180;
                    return (
                      <motion.button
                        key={option.key}
                        type="button"
                        onClick={() => ask(option.ask, true)}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4, transition: { duration: 0.12 } }}
                        transition={{ type: "spring", duration: 0.35, bounce: 0.35, delay: reduceMotion ? 0 : index * 0.03 }}
                        style={{
                          left: `calc(50% + ${Math.cos(angle).toFixed(3)} * var(--ring))`,
                          top: `calc(50% + ${Math.sin(angle).toFixed(3)} * var(--ring) * 0.8)`,
                        }}
                        className="type-osd pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 border-2 border-foreground bg-surface px-2.5 py-1 text-sm whitespace-nowrap shadow-[3px_3px_0_var(--osd)] outline-none hover:bg-osd hover:text-osd-foreground focus-visible:bg-osd focus-visible:text-osd-foreground sm:text-base"
                      >
                        {option.label}
                      </motion.button>
                    );
                  })}
                </motion.nav>
              )}
            </AnimatePresence>
            <MrP3D
              state={conversation.mascotState(draft)}
              emotion={conversation.emotion}
              label={open ? "Mr. P. Close his speech bubble." : "Mr. P. Click to hear what he has to say."}
              expanded={open}
              onActivate={poke}
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
