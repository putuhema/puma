"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { InstrumentMount } from "@/components/instruments";
import { MrP3D } from "@/components/mr-p-3d";
import { PrintedText, ThinkingDots } from "@/components/speech";
import { useSfx } from "@/components/sound-control";
import { useConversation } from "@/hooks/use-conversation";
import { busyPrompts, linePrompts, pocketGreeting } from "@/lib/station-replies";
import type { Archive } from "@/lib/transmission";

/**
 * Off the chat, Mr. P floats docked in the bottom-right corner, bobbing in
 * place, never drifting over a link. Click him and a chat box slides out to
 * his left (above him on phones), where he answers just like on the home
 * page: one line at a time, with instruments when they help.
 */
export function DockedMrP({ archive }: { archive: Archive }) {
  const reduceMotion = useReducedMotion();
  const sound = useSfx();
  const conversation = useConversation({ archive, greeting: pocketGreeting });
  const { current, lastWords, sentLines, receiving, busy, printingId, isPrinting, lineDone, instruments } = conversation;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const greeted = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  function toggle() {
    if (open) return close();
    setOpen(true);
    if (!greeted.current) {
      greeted.current = true;
      conversation.replayCurrent();
    }
  }

  function close() {
    setOpen(false);
    conversation.skip();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    void conversation.ask(draft);
    setDraft("");
  }

  // Esc skips his line, then closes the box. Handled here so the page
  // doesn't also treat it as "step back out".
  function operate(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (printingId) conversation.skip();
    else close();
  }

  return (
    <div className="fixed right-2 bottom-2 z-50 flex flex-col items-end pb-[env(safe-area-inset-bottom)] sm:flex-row sm:items-end">
      <AnimatePresence>
        {open && (
          <motion.section
            key="pocket-chat"
            aria-label="Chat with Mr. P"
            onKeyDown={operate}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.92, transition: { duration: 0.15 } }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
            className="relative mb-3 w-[calc(100vw-1rem)] origin-bottom-right sm:mr-3 sm:mb-8 sm:w-[min(28rem,calc(100vw-12rem))]"
          >
            {/* The tail points at Mr. P: down on phones, right beside him. */}
            <span
              aria-hidden="true"
              className="absolute right-12 -bottom-[11px] size-5 rotate-45 border-r-2 border-b-2 border-foreground bg-surface sm:top-auto sm:-right-[11px] sm:bottom-10 sm:-rotate-45"
            />
            <div className="flex flex-col gap-3 border-2 border-foreground bg-surface px-4 pt-6 pb-4 shadow-[6px_6px_0_var(--osd)]">
              <p className="type-label absolute -top-3 left-4 bg-osd px-2 py-1 text-osd-foreground">Mr. P</p>
              <button
                type="button"
                onClick={close}
                className="type-label absolute -top-3 right-4 border border-foreground bg-surface px-2 py-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
              >
                <span aria-hidden="true">✕ Esc</span>
                <span className="sr-only">Close chat</span>
              </button>

              <div
                aria-live="polite"
                onClick={() => printingId && conversation.skip()}
                className="max-h-[min(50dvh,26rem)] min-h-8 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
              >
                {receiving || !current ? (
                  <ThinkingDots />
                ) : (
                  <PrintedText
                    key={current.id}
                    text={current.text}
                    complete={current.complete}
                    printing={isPrinting}
                    onTick={sound.blip}
                    onPrinted={() => conversation.finishPrinting(current)}
                    className="text-xl leading-6 sm:text-xl sm:leading-6"
                  />
                )}
                {lineDone && instruments.length > 0 && (
                  <div className="mt-4 flex flex-col gap-4">
                    {instruments.map((instrument) => (
                      <div key={instrument} data-instrument={instrument}>
                        <InstrumentMount
                          instrument={instrument}
                          archive={archive}
                          onAsk={(question) => void conversation.ask(question, true)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {lastWords && (
                <p className="type-osd flex min-w-0 items-baseline gap-2 text-xs">
                  <span className="type-label shrink-0 text-muted-foreground">You said</span>
                  <span className="truncate bg-osd px-1.5 py-0.5 text-osd-foreground [text-shadow:none]">
                    {lastWords.text}
                  </span>
                </p>
              )}

              <form onSubmit={submit}>
                <label className="flex h-10 items-center gap-2 border bg-background px-2.5 focus-within:border-osd focus-within:ring-2 focus-within:ring-osd/30">
                  <span aria-hidden="true" className="font-semibold text-osd">
                    ▸
                  </span>
                  <span className="sr-only">Say something to Mr. P</span>
                  <input
                    ref={input}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={500}
                    autoComplete="off"
                    autoFocus
                    placeholder={
                      busy
                        ? busyPrompts[sentLines.length % busyPrompts.length]
                        : linePrompts[(sentLines.length % (linePrompts.length - 1)) + 1]
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <span aria-hidden="true" className="type-label shrink-0 text-muted-foreground">
                    ⏎
                  </span>
                </label>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <MrP3D
        state={open ? conversation.mascotState(draft) : "idle"}
        emotion={conversation.emotion}
        label={open ? "Mr. P. Close the chat." : "Mr. P. Click to chat with him."}
        expanded={open}
        onActivate={toggle}
        className="block h-28 w-24 shrink-0 sm:h-36 sm:w-32"
      />
    </div>
  );
}
