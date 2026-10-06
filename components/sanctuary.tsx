"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useSfx } from "@/components/sound-control";
import { cn } from "@/lib/utils";

const sessionKey = "puma:sanctuary:session";
const nameKey = "puma:sanctuary:name";
const heartbeatMs = 15_000;
/** Seen this recently, still counts as here. */
const presentMs = 45_000;
const maxName = 24;
const maxBody = 280;

function timeOf(at: number) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
}

/** This browser's seat in the room: a stable id, and the name it last used. */
function useSeat() {
  const [seat, setSeat] = useState<{ sessionId: string; name: string } | null>(null);

  useEffect(() => {
    let sessionId = window.localStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.localStorage.setItem(sessionKey, sessionId);
    }
    const name =
      window.localStorage.getItem(nameKey) ?? `Earthling-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
    // Read once on mount: storage only exists in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeat({ sessionId, name });
  }, []);

  function rename(name: string) {
    window.localStorage.setItem(nameKey, name);
    setSeat((current) => (current ? { ...current, name } : current));
  }

  return { seat, rename };
}

/**
 * The Sanctuary: a quiet room on channel 03 where visitors talk to each
 * other in real time. Messages and who's here come live from Convex; your
 * own lines are highlighted, and the log sticks to the bottom unless you've
 * scrolled up to read.
 */
export function Sanctuary() {
  const sound = useSfx();
  const messages = useQuery(api.messages.list);
  const presence = useQuery(api.presence.list);
  const send = useMutation(api.messages.send);
  const heartbeat = useMutation(api.presence.heartbeat);
  const leave = useMutation(api.presence.leave);
  const { seat, rename } = useSeat();
  const [draft, setDraft] = useState("");
  const [naming, setNaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const log = useRef<HTMLOListElement>(null);
  const pinned = useRef(true);
  const heard = useRef(0);

  // Check in while the tab is open, and leave when it closes.
  const sessionId = seat?.sessionId;
  const name = seat?.name;
  useEffect(() => {
    if (!sessionId || !name) return;
    const beat = () => {
      if (!document.hidden) void heartbeat({ sessionId, name });
      setNow(Date.now());
    };
    beat();
    const timer = window.setInterval(beat, heartbeatMs);
    const goodbye = () => void leave({ sessionId });
    window.addEventListener("pagehide", goodbye);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", goodbye);
      goodbye();
    };
  }, [heartbeat, leave, name, sessionId]);

  // Keep the newest line in view, unless the visitor scrolled up to read.
  useLayoutEffect(() => {
    const list = log.current;
    if (list && pinned.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  // A blip when someone else speaks.
  useEffect(() => {
    if (!messages) return;
    const latest = messages.at(-1);
    if (heard.current && latest && latest.at > heard.current && latest.sessionId !== sessionId) sound.blip();
    heard.current = latest?.at ?? Date.now();
  }, [messages, sessionId, sound]);

  const here = (presence ?? []).filter((visitor) => now - visitor.lastSeen < presentMs);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seat || !draft.trim()) return;
    const body = draft;
    setDraft("");
    setNotice(null);
    pinned.current = true;
    try {
      await send({ sessionId: seat.sessionId, name: seat.name, body });
      sound.send();
    } catch (error) {
      setDraft(body);
      setNotice(error instanceof ConvexError ? String(error.data) : "The signal dropped. Try again.");
      sound.error();
    }
  }

  return (
    <div className="type-osd flex min-h-0 flex-1 flex-col px-4 py-5 sm:px-10 sm:py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="bg-osd-foreground px-2 py-0.5 text-lg leading-7 text-osd">Sanctuary</h1>
        <p className="flex items-center gap-2 text-sm">
          <span aria-hidden="true" className="size-2.5 animate-lamp bg-signal shadow-[0_0_8px_var(--signal)]" />
          {here.length} here now
        </p>
      </header>
      <p className="mt-2 max-w-xl text-xs leading-5 opacity-85">
        A quiet room off the main channel. Say hello to whoever else is tuned in; be kind, it&rsquo;s a sanctuary.
      </p>
      {here.length > 0 && (
        <ul aria-label="Who's here" className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {here.slice(0, 12).map((visitor) => (
            <li
              key={visitor.sessionId}
              className={cn(
                "border border-osd-foreground/60 px-1.5 py-0.5",
                visitor.sessionId === sessionId && "bg-osd-foreground text-osd",
              )}
            >
              {visitor.name}
            </li>
          ))}
          {here.length > 12 && <li className="px-1.5 py-0.5 opacity-80">+{here.length - 12} more</li>}
        </ul>
      )}

      <ol
        ref={log}
        aria-label="Messages"
        aria-live="polite"
        onScroll={(event) => {
          const list = event.currentTarget;
          pinned.current = list.scrollHeight - list.scrollTop - list.clientHeight < 48;
        }}
        className="mt-5 flex min-h-48 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain border-y border-osd-foreground/40 py-4 font-tube text-xl leading-6 normal-case [scrollbar-width:thin] sm:text-2xl sm:leading-7"
      >
        {messages === undefined ? (
          <li className="animate-lamp">Tuning in…</li>
        ) : messages.length === 0 ? (
          <li className="opacity-80">Nobody has said anything yet. Be the first!</li>
        ) : (
          messages.map((message) => {
            const mine = message.sessionId === sessionId;
            return (
              <li key={message.id} className="flex gap-3">
                <time dateTime={new Date(message.at).toISOString()} className="shrink-0 opacity-60">
                  {timeOf(message.at)}
                </time>
                <p className="min-w-0 break-words">
                  <span className={cn("mr-2", mine ? "bg-osd-foreground px-1 text-osd" : "text-signal")}>
                    {message.name}
                  </span>
                  {message.body}
                </p>
              </li>
            );
          })
        )}
      </ol>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 pr-24 sm:pr-36">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="opacity-80">Speaking as</span>
          {naming ? (
            <input
              autoFocus
              defaultValue={seat?.name}
              maxLength={maxName}
              aria-label="Your name"
              onBlur={(event) => {
                const next = event.currentTarget.value.trim();
                if (next) rename(next);
                setNaming(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setNaming(false);
                }
              }}
              className="w-40 border border-osd-foreground bg-transparent px-1.5 py-0.5 outline-none focus-visible:bg-osd-foreground/10"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNaming(true)}
              className="bg-osd-foreground px-1.5 py-0.5 text-osd outline-none focus-visible:ring-2 focus-visible:ring-osd-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-osd"
            >
              {seat?.name ?? "…"} ✎
            </button>
          )}
        </div>
        <label className="flex h-11 items-center gap-2 border border-osd-foreground px-3 focus-within:bg-osd-foreground/10">
          <span aria-hidden="true">▸</span>
          <span className="sr-only">Message</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={maxBody}
            autoComplete="off"
            disabled={!seat}
            placeholder="Say something to the room…"
            className="min-w-0 flex-1 bg-transparent font-tube text-xl normal-case outline-none placeholder:text-osd-foreground/60"
          />
          <span aria-hidden="true" className="text-xs opacity-70">
            {draft.length > maxBody - 40 ? maxBody - draft.length : "⏎"}
          </span>
        </label>
        {notice && (
          <p role="alert" className="text-xs text-signal">
            {notice}
          </p>
        )}
      </form>
    </div>
  );
}
