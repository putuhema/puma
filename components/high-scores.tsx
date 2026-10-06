"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useSfx } from "@/components/sound-control";
import { stationSession } from "@/lib/session";
import { awardStamp } from "@/lib/stamps";
import { cn } from "@/lib/utils";

const boardSize = 10;

/**
 * Star Catcher's high-score table, over the cabinet's glass. Between games
 * there's a button to look at the board; after a game good enough to make
 * it, three arcade initials go up in lights. Taking first place tells Mr. P.
 */
export function HighScores({
  phase,
  score,
  onRecord,
}: {
  phase: "ready" | "playing" | "over";
  score: number;
  onRecord?: (score: number) => void;
}) {
  const sound = useSfx();
  const board = useQuery(api.scores.top);
  const submit = useMutation(api.scores.submit);
  const [open, setOpen] = useState(false);
  const [initials, setInitials] = useState("");
  /** The score already put up (or turned down), so it isn't offered twice. */
  const [filed, setFiled] = useState<{ score: number; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  if (phase === "playing" || !board) return null;

  const qualifies =
    phase === "over" &&
    score > 0 &&
    filed?.score !== score &&
    board.filter((entry) => entry.score >= score).length < boardSize;

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const place = await submit({ sessionId: stationSession(), initials, score });
      sound.receive();
      awardStamp("board");
      setFiled({ score, text: place === 1 ? "New record. Mr. P has been told." : `You're number ${place} on the board.` });
      setOpen(true);
      if (place === 1) onRecord?.(score);
    } catch (error) {
      sound.error();
      setFiled({ score, text: error instanceof ConvexError ? String(error.data) : "The board didn't take it. Try again." });
    } finally {
      setSending(false);
    }
  }

  if (qualifies) {
    return (
      <form
        onSubmit={enter}
        className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-tube/90 px-3 py-2 font-tube text-xl leading-6 text-tube-foreground uppercase"
      >
        <span className="text-signal">High score! Initials</span>
        <label className="sr-only" htmlFor="star-catcher-initials">
          Your initials, up to three letters
        </label>
        <input
          id="star-catcher-initials"
          autoFocus
          value={initials}
          onChange={(event) => setInitials(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))}
          maxLength={3}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="___"
          className="w-16 border-b-2 border-current bg-transparent text-center text-2xl tracking-[0.3em] outline-none placeholder:text-tube-foreground/40"
        />
        <button
          type="submit"
          disabled={!initials || sending}
          className="bg-tube-foreground px-2 text-tube outline-none [text-shadow:none] focus-visible:ring-2 focus-visible:ring-osd disabled:opacity-50"
        >
          ⏎ Put it up
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-tube px-1.5 font-tube text-lg leading-6 text-tube-foreground uppercase outline-none hover:bg-tube-foreground hover:text-tube focus-visible:ring-2 focus-visible:ring-osd"
      >
        {open ? "✕ Close" : "▤ Board"}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="High scores"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setOpen(false);
            }
          }}
          className="absolute inset-x-3 top-3 bottom-12 z-10 overflow-y-auto bg-tube/95 px-4 py-2 font-tube text-xl leading-6 text-tube-foreground uppercase [scrollbar-width:thin]"
        >
          <p className="text-center text-signal">High scores</p>
          {filed && <p className="text-center text-base normal-case opacity-80">{filed.text}</p>}
          {board.length === 0 ? (
            <p className="mt-2 text-center opacity-70">Nobody yet. The board is yours.</p>
          ) : (
            <ol className="mx-auto mt-1 max-w-xs">
              {board.map((entry, index) => (
                <li
                  key={entry.id}
                  className={cn("flex justify-between gap-4", index === 0 && "text-signal", filed?.score === entry.score && "bg-tube-foreground/15")}
                >
                  <span className="opacity-60">{String(index + 1).padStart(2, "0")}</span>
                  <span className="tracking-[0.2em]">{entry.initials}</span>
                  <span>{String(entry.score).padStart(5, "0")}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  );
}
