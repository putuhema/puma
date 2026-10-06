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
import { MrP3D } from "@/components/mr-p-3d";
import { useSlashCommands } from "@/components/slash-commands";
import { useSfx } from "@/components/sound-control";
import { LineAnnouncer, PrintedText, ThinkingDots } from "@/components/speech";
import { useStation } from "@/components/station-context";
import { OnAir } from "@/components/convex-client-provider";
import { StationReadout } from "@/components/station-readout";
import { VisitorSaucers } from "@/components/visitor-saucers";
import { useConversation } from "@/hooks/use-conversation";
import { useWander } from "@/hooks/use-wander";
import { lastReading, visitCount } from "@/lib/memory";
import { stationPhase } from "@/lib/schedule";
import { awardStamp } from "@/lib/stamps";
import { bootGreeting, busyPrompts, greetingFor, linePrompts, tour, touredKey } from "@/lib/station-replies";
import type { Archive } from "@/lib/transmission";

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"))
  );
}

/**
 * The portfolio itself: Mr. P floating in ASCII space, waiting to be talked
 * to like an NPC. His speech bubble only pops up over his head once the
 * visitor speaks (or clicks him), and only ever holds his current line; the visitor's last words sit by the input. Replies stream in
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
  const pendingAsk = useRef(initialAsk ?? null);
  const recallIndex = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLElement>(null);
  /** Whether the share link for his current line was just copied. */
  const [copied, setCopied] = useState<string | null>(null);
  /** Which line of the first-visit tour he's on, or null when he isn't touring. */
  const [tourStep, setTourStep] = useState<number | null>(null);

  useEffect(() => {
    setStatus(receiving ? "receiving" : busy ? "printing" : "standby");
  }, [busy, receiving, setStatus]);

  useEffect(() => () => setStatus("standby"), [setStatus]);

  // A new line from Mr. P: bring him and his bubble back into view.
  const currentId = current?.id;
  useEffect(() => {
    screen.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [currentId, reduceMotion, screen]);

  const { ask: send, say, skip } = conversation;
  const ask = useCallback(
    (question: string, viaSoftKey = false) => {
      if (!question.trim() || busy) return;
      recallIndex.current = -1;
      greeted.current = true;
      setOpen(true);
      void send(question, viaSoftKey);
    },
    [busy, send],
  );

  /**
   * Walk up to him: the bubble pops up, with his hello the first time,
   * fitted to the hour and to whether he's seen this visitor before.
   */
  const talk = useCallback(() => {
    sound.key();
    setOpen(true);
    if (!greeted.current) {
      greeted.current = true;
      say(greetingFor({ phase: stationPhase(), visits: visitCount(), reading: lastReading() }));
    }
    input.current?.focus();
  }, [say, sound]);

  /** The tour: his bubble pops up and he walks the visitor round the set. */
  const startTour = useCallback(() => {
    window.localStorage.setItem(touredKey, "1");
    greeted.current = true;
    setOpen(true);
    setTourStep(0);
    say(tour[0]);
  }, [say]);

  const nextTour = useCallback(() => {
    if (tourStep === null) return;
    sound.key();
    const next = tourStep + 1;
    if (next >= tour.length) {
      setTourStep(null);
      awardStamp("toured");
      return;
    }
    setTourStep(next);
    say(tour[next]);
  }, [say, sound, tourStep]);

  // A visitor's first time on the desk: he gives the tour, once, unless
  // they arrived with a question already in hand (?ask=…).
  useEffect(() => {
    if (initialAsk || window.localStorage.getItem(touredKey)) return;
    const timer = window.setTimeout(startTour, 700);
    return () => window.clearTimeout(timer);
    // On arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Clicking him: his bubble pops up, or goes away. */
  const poke = useCallback(() => {
    if (!open) return talk();
    setOpen(false);
    setTourStep(null);
    skip();
  }, [open, skip, talk]);

  const close = useCallback(() => {
    setOpen(false);
    setTourStep(null);
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

      // "/" from anywhere opens the line's skills.
      if (event.key === "/" && !typing) {
        event.preventDefault();
        input.current?.focus();
        setDraft((line) => line || "/");
        return;
      }

      // Any other printable key lands on the line, wherever focus was.
      if (!typing && event.key.length === 1 && event.key !== " ") {
        input.current?.focus();
      }
    }

    window.addEventListener("keydown", operateDesk);
    return () => window.removeEventListener("keydown", operateDesk);
  }, [close, draft, focusLatestInstrument, keymapOpen, open, printingId, receiving, skip]);

  const slash = useSlashCommands({
    draft,
    setDraft,
    archive,
    onAsk: (question) => ask(question, true),
    onTeach: startTour,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (slash.submit() || busy) return;
    // Mid-tour, Enter on an empty line is "go on".
    if (tourStep !== null && !draft.trim()) return nextTour();
    setDraft("");
    if (/^(help|tour|\?)$/i.test(draft.trim())) return startTour();
    // Asking something real ends the tour; the visitor's got the hang of it.
    setTourStep(null);
    ask(draft);
  }

  function operateLine(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (slash.onKeyDown(event)) return;
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

  /**
   * Shares his current line as a still: the phone's share sheet where there
   * is one, otherwise the link goes on the clipboard.
   */
  async function shareLine() {
    if (!current?.sig) return;
    const url = `${window.location.origin}/said?l=${encodeURIComponent(current.text.trim())}&s=${current.sig}`;
    sound.key();
    if (navigator.share) {
      await navigator.share({ title: "Mr. P said", url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(current.id);
    window.setTimeout(() => setCopied(null), 2000);
  }

  /** What his line brings along: a file, the scope, a game. */
  const mounted = conversation.instruments;
  const touring = tourStep !== null;

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
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <AsciiSpace className="absolute inset-0 size-full" />
      <OnAir>
        <VisitorSaucers />
      </OnAir>
      <h1 className="sr-only">Talk to Mr. P</h1>
      <StationReadout
        archive={archive}
        className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-3 z-0 sm:top-[calc(env(safe-area-inset-top)+1.25rem)] sm:left-6 lg:left-10"
      />

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

                        {mounted.length > 0 && (
                          <div className="mt-5 flex flex-col gap-5">
                            {mounted.map((instrument) => (
                              <div key={instrument} data-instrument={instrument}>
                                <InstrumentMount
                                  instrument={instrument}
                                  archive={archive}
                                  entry={current?.entry}
                                  onAsk={(question) => ask(question, true)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* On the tour: where he is, and the way on. */}
                      {touring && lineDone && (
                        <div className="type-osd mt-4 flex items-center justify-between gap-3 text-sm leading-4">
                          <span className="text-muted-foreground">
                            Tour {tourStep + 1}/{tour.length}
                          </span>
                          <span className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                close();
                              }}
                              className="border border-rule px-2 py-1 text-muted-foreground outline-none hover:border-osd hover:text-foreground focus-visible:border-osd focus-visible:text-foreground"
                            >
                              Skip
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                nextTour();
                                input.current?.focus();
                              }}
                              className="border border-osd bg-osd px-2 py-1 text-osd-foreground outline-none [text-shadow:none] focus-visible:ring-2 focus-visible:ring-osd/40"
                            >
                              {tourStep + 1 === tour.length ? "Done ⏎" : "Next ▸ ⏎"}
                            </button>
                          </span>
                        </div>
                      )}

                      {/* A line worth keeping can go out as a still. */}
                      {!touring && lineDone && current?.sig && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void shareLine();
                            }}
                            className="type-label px-1 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
                          >
                            {copied === current.id ? "Link copied" : "⇪ Share this line"}
                          </button>
                        </div>
                      )}

                      {/* The classic "more" cursor once he's said his piece. */}
                      {lineDone && !touring && mounted.length === 0 && !current?.sig && (
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

          <form onSubmit={submit} className="relative flex items-stretch gap-2">
            {slash.menu}
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
                {...slash.inputProps}
                maxLength={500}
                autoComplete="off"
                autoFocus
                placeholder={
                  busy
                    ? busyPrompts[sentLines.length % busyPrompts.length]
                    : touring
                      ? "⏎ for the next bit, Esc to skip, or ask him something"
                      : linePrompts[sentLines.length % linePrompts.length]
                }
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <span aria-hidden="true" className="type-label shrink-0 text-muted-foreground">
                ⏎
              </span>
            </label>
          </form>
        </div>
      </div>

      <LineAnnouncer text={open && lineDone && current ? current.text : null} />
      {keymapOpen && <KeyboardMap onClose={() => setKeymapOpen(false)} />}
    </div>
  );
}
