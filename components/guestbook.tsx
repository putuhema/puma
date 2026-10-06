"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useSfx } from "@/components/sound-control";
import { stationSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const maxName = 24;
const maxBody = 140;
const nameKey = "puma:sanctuary:name";

function dayOf(at: number) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(at);
}

/**
 * The station guestbook: one line per visitor, kept for good, newest on
 * top. Unlike the Sanctuary, nothing here scrolls away.
 */
export function Guestbook() {
  const sound = useSfx();
  const signatures = useQuery(api.guestbook.list);
  const sign = useMutation(api.guestbook.sign);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Storage only exists in the browser; read it once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(stationSession());
    setName(window.localStorage.getItem(nameKey) ?? "");
  }, []);

  const mine = signatures?.find((signature) => signature.sessionId === sessionId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionId || sending) return;
    setSending(true);
    setNotice(null);
    try {
      await sign({ sessionId, name, body });
      window.localStorage.setItem(nameKey, name.trim());
      setBody("");
      sound.send();
    } catch (error) {
      sound.error();
      setNotice(error instanceof ConvexError ? String(error.data) : "The pen ran dry. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-5 font-tube text-xl leading-6 uppercase sm:px-10 sm:py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="bg-signal px-2 text-2xl leading-7 text-amber-glass [text-shadow:none] sm:text-3xl">Guestbook</h1>
        <p className="opacity-80">{signatures ? `${signatures.length} signed` : "Opening…"}</p>
      </header>
      <p className="mt-2 max-w-xl normal-case opacity-85">
        Leave one line for the operator and every visitor after you. It stays.
      </p>

      {mine ? (
        <p className="mt-5 border-2 border-dashed border-current px-3 py-2 normal-case">
          You signed on {dayOf(mine.at)}. Thanks for stopping by.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3 border-2 border-current p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-col gap-1 sm:w-48">
              <span className="text-base opacity-80">Signed</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={maxName}
                required
                autoComplete="nickname"
                className="h-10 border-b-2 border-current bg-transparent px-1 normal-case outline-none focus-visible:bg-signal/10"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="flex justify-between text-base opacity-80">
                <span>Your line</span>
                <span aria-hidden="true">{maxBody - body.length}</span>
              </span>
              <input
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={maxBody}
                required
                autoComplete="off"
                placeholder="Was here. Liked the alien."
                className="h-10 border-b-2 border-current bg-transparent px-1 normal-case outline-none placeholder:text-signal/50 focus-visible:bg-signal/10"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-base normal-case text-stamp">
              {notice}
            </p>
            <button
              type="submit"
              disabled={!sessionId || sending}
              className="bg-signal px-3 text-amber-glass outline-none [text-shadow:none] focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-amber-glass disabled:opacity-50"
            >
              ⏎ Sign the book
            </button>
          </div>
        </form>
      )}

      <ol aria-label="Signatures" className="mt-6 flex flex-col">
        {signatures === undefined ? (
          <li className="animate-lamp">Turning pages…</li>
        ) : signatures.length === 0 ? (
          <li className="opacity-80">Blank pages. Be the first to sign.</li>
        ) : (
          signatures.map((signature) => (
            <li
              key={signature.id}
              className={cn(
                "flex flex-col gap-0.5 border-b border-dashed border-current/40 py-2.5 sm:flex-row sm:gap-4",
                signature.sessionId === sessionId && "bg-signal/10",
              )}
            >
              <time dateTime={new Date(signature.at).toISOString()} className="shrink-0 text-base opacity-60 sm:w-32 sm:text-xl">
                {dayOf(signature.at)}
              </time>
              <p className="min-w-0 flex-1 break-words normal-case">“{signature.body}”</p>
              <p className="shrink-0 sm:text-right">— {signature.name}</p>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
