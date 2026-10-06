"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { OnAir } from "@/components/convex-client-provider";
import { Leader } from "@/components/leader";
import { NotesScope } from "@/components/notes-scope";
import { usePreferences } from "@/components/set-preferences";
import { useSfx, useSound } from "@/components/sound-control";
import { StarCatcher } from "@/components/star-catcher";
import { TapeShelf } from "@/components/tape-shelf";
import { formatEntryDate } from "@/lib/format";
import { stationSession } from "@/lib/session";
import { now, profile, profileLinks, siteConfig } from "@/lib/site";
import { findEntry, type Archive, type Instrument } from "@/lib/transmission";
import { cn } from "@/lib/utils";

/** A mailbox to fall back on when the live transmitter is off the air. */
const fallbackEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

function Dossier({ archive }: { archive: Archive }) {
  return (
    <article className="relative max-w-2xl border bg-surface p-5 shadow-[3px_3px_0_var(--osd)] sm:p-6">
      <div className="type-label flex justify-between gap-4 text-muted-foreground">
        <span>Research department · Bureau of {siteConfig.author}</span>
        <span>File P4-001</span>
      </div>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
        <figure className="relative h-56 w-full shrink-0 overflow-hidden bg-tube sm:w-40">
          <Image
            src="/human.png"
            alt="An illustrated medieval knight standing in for the operator's photo"
            fill
            sizes="10rem"
            className="object-contain object-bottom contrast-125 grayscale"
          />
          <span aria-hidden="true" className="tv-static absolute inset-0 opacity-20" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-tube/80 px-2 py-1 font-tube text-sm text-tube-foreground uppercase">
            Plate 1 · artist&rsquo;s impression
          </figcaption>
        </figure>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-5xl leading-[0.85] font-bold tracking-[-0.03em] uppercase">
            {siteConfig.author}
          </h3>
          <dl className="mt-4">
            <Leader label="Role">{profile.role}</Leader>
            {profile.location && <Leader label="Based in">{profile.location}</Leader>}
            <Leader label="Known for">Loves to build stuff</Leader>
            <Leader label="Status">
              <span className="relative inline-block px-1 after:absolute after:-inset-x-2 after:-inset-y-1 after:rotate-[-3deg] after:rounded-[50%] after:border-[1.5px] after:border-stamp">
                Away from desk
              </span>
            </Leader>
            <Leader label="On file">
              {archive.projects.length} project{archive.projects.length === 1 ? "" : "s"} · {archive.notes.length} note
              {archive.notes.length === 1 ? "" : "s"}
            </Leader>
          </dl>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/teletext" className="underline decoration-dotted underline-offset-4 outline-none hover:text-osd focus-visible:text-osd">
              Plain facts (teletext) →
            </Link>
            {profileLinks
              .filter((link) => link.href.startsWith("http"))
              .map((link) => (
                <a key={link.label} href={link.href} className="underline decoration-dotted underline-offset-4 outline-none hover:text-osd focus-visible:text-osd">
                  {link.label} ↗
                </a>
              ))}
          </p>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="animate-stamp absolute right-4 bottom-5 rotate-[-8deg] sm:top-14 sm:bottom-auto border-2 border-stamp px-2.5 py-1 font-display text-sm font-bold tracking-[0.14em] text-stamp uppercase"
      >
        Declassified
      </p>
    </article>
  );
}

/** A door to channel 03, where visitors talk to each other live. */
function SanctuaryDoor() {
  return (
    <div className="tube animate-tube-on type-osd max-w-2xl bg-osd px-5 py-5 text-osd-foreground sm:px-7">
      <p className="bg-osd-foreground py-0.5 text-center text-lg leading-7 text-osd">CH 03 · Sanctuary</p>
      <p className="mt-4 text-sm leading-6">
        A quiet room off the main channel where visitors talk to each other in real time. Pick a name, say hello.
      </p>
      <Link
        href="/sanctuary"
        className="mt-4 inline-flex bg-osd-foreground px-2 py-0.5 text-osd outline-none focus-visible:ring-2 focus-visible:ring-osd-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-osd"
      >
        ▶ Enter the Sanctuary
      </Link>
    </div>
  );
}

type TransmitterState = { phase: "ready" | "sending" | "sent" } | { phase: "error"; message: string };

/**
 * The contact form. Live, it files the message on Convex (which emails the
 * operator a copy); off the air it hands off to the visitor's mail client
 * if there's a mailbox to address, and says so plainly if there isn't.
 */
function Transmitter() {
  return (
    <OnAir
      offline={
        fallbackEmail ? (
          <TransmitterForm
            note="Opens your mail client, addressed to the operator."
            onTransmit={async ({ name, message }) => {
              const subject = encodeURIComponent(`Message for ${siteConfig.author}${name ? ` from ${name}` : ""}`);
              const mailto = document.createElement("a");
              mailto.href = `mailto:${fallbackEmail}?subject=${subject}&body=${encodeURIComponent(message)}`;
              mailto.click();
            }}
          />
        ) : (
          <div className="max-w-2xl border bg-surface p-4 text-sm shadow-[3px_3px_0_var(--osd)]">
            The transmitter is off the air on this copy of the station.
          </div>
        )
      }
    >
      <LiveTransmitter />
    </OnAir>
  );
}

function LiveTransmitter() {
  const send = useMutation(api.transmissions.send);
  return (
    <TransmitterForm
      note="Goes straight to the operator. Leave an email if you'd like a reply."
      askReplyTo
      onTransmit={({ name, replyTo, message }) =>
        send({ sessionId: stationSession(), name, replyTo, body: message }).then(() => undefined)
      }
    />
  );
}

function TransmitterForm({
  note,
  askReplyTo = false,
  onTransmit,
}: {
  note: string;
  askReplyTo?: boolean;
  onTransmit: (message: { name: string; replyTo: string; message: string }) => Promise<void>;
}) {
  const sound = useSfx();
  const [state, setState] = useState<TransmitterState>({ phase: "ready" });

  async function transmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.phase === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ phase: "sending" });
    try {
      await onTransmit({
        name: String(data.get("from") ?? "").trim(),
        replyTo: String(data.get("replyTo") ?? "").trim(),
        message: String(data.get("message") ?? "").trim(),
      });
      form.reset();
      sound.send();
      setState({ phase: "sent" });
    } catch (error) {
      sound.error();
      setState({
        phase: "error",
        message: error instanceof ConvexError ? String(error.data) : "The signal dropped. Try again in a moment.",
      });
    }
  }

  const lamp = {
    ready: "Ready",
    sending: "Transmitting…",
    sent: "Received",
    error: "No carrier",
  }[state.phase];

  return (
    <form
      onSubmit={transmit}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          event.currentTarget.requestSubmit();
        }
      }}
      className="max-w-2xl border bg-surface shadow-[3px_3px_0_var(--osd)]">
      <div className="tube flex items-center justify-between rounded-none bg-amber-glass px-4 py-2 font-tube text-xl text-signal uppercase">
        <span>Transmitter · freq 121.5</span>
        <span className={cn(state.phase === "ready" || state.phase === "sending" ? "animate-lamp" : "")}>{lamp}</span>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="type-label text-muted-foreground">Call sign (your name)</span>
            <input
              name="from"
              autoComplete="name"
              maxLength={60}
              className="h-11 border bg-background px-3 text-base outline-none focus-visible:border-osd focus-visible:ring-2 focus-visible:ring-osd/30"
            />
          </label>
          {askReplyTo && (
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="type-label text-muted-foreground">Reply to (email, optional)</span>
              <input
                name="replyTo"
                type="email"
                autoComplete="email"
                maxLength={120}
                className="h-11 border bg-background px-3 text-base outline-none focus-visible:border-osd focus-visible:ring-2 focus-visible:ring-osd/30"
              />
            </label>
          )}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="type-label text-muted-foreground">Message</span>
          <textarea
            name="message"
            required
            rows={4}
            maxLength={2000}
            className="resize-y border bg-background bg-[linear-gradient(transparent_1.6rem,var(--rule)_1.6rem,var(--rule)_calc(1.6rem+1px),transparent_calc(1.6rem+1px))] bg-[length:100%_1.65rem] px-3 py-1 text-base leading-[1.65rem] outline-none focus-visible:border-osd focus-visible:ring-2 focus-visible:ring-osd/30"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className={cn("text-xs", state.phase === "error" ? "text-stamp" : "text-muted-foreground")}>
            {state.phase === "sent"
              ? "Message received. The operator will see it when they're back at the desk."
              : state.phase === "error"
                ? state.message
                : note}
          </p>
          <button
            type="submit"
            disabled={state.phase === "sending"}
            className="key flex h-11 items-center gap-2 bg-osd px-4 text-[0.8125rem] font-medium text-osd-foreground uppercase outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-osd disabled:opacity-60"
          >
            ⌘⏎ Transmit
          </button>
        </div>
      </div>
    </form>
  );
}

/** One note or project, pulled from the archive when Mr. P recommends it. */
function FileCard({ archive, href }: { archive: Archive; href?: string }) {
  const entry = findEntry(archive, href);
  if (!entry) return null;
  const kind = entry.href.startsWith("/projects/") ? "Project tape" : "Note";

  return (
    <Link
      href={entry.href}
      className="group block max-w-2xl border bg-surface p-4 shadow-[3px_3px_0_var(--osd)] outline-none hover:border-osd focus-visible:border-osd focus-visible:ring-2 focus-visible:ring-osd/30 sm:p-5"
    >
      <span className="type-label flex justify-between gap-4 text-muted-foreground">
        <span>{kind}</span>
        <time dateTime={entry.publishedAt}>{formatEntryDate(entry.publishedAt)}</time>
      </span>
      <span className="mt-2 block font-osd text-2xl leading-7 uppercase group-hover:text-osd group-focus-visible:text-osd">
        {entry.title}
      </span>
      <span className="mt-2 block text-sm leading-6 text-muted-foreground">{entry.summary}</span>
      {entry.stack.length > 0 && <span className="type-label mt-3 block text-muted-foreground">{entry.stack.join(" · ")}</span>}
      <span className="type-label mt-3 block text-osd">▶ Play it</span>
    </Link>
  );
}

/** What the operator is up to these days. */
function NowPanel() {
  return (
    <article className="max-w-2xl border bg-surface p-4 shadow-[3px_3px_0_var(--osd)] sm:p-5">
      <p className="type-label flex justify-between gap-4 text-muted-foreground">
        <span>Now playing</span>
        <span>Logged {formatEntryDate(now.updatedAt)}</span>
      </p>
      {now.items.length ? (
        <dl className="mt-3">
          {now.items.map((item) => (
            <Leader key={item.label} label={item.label}>
              {item.value}
            </Leader>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nothing logged. The operator is, apparently, resting.</p>
      )}
    </article>
  );
}

/** A door to the guestbook, where visitors leave one line for good. */
function GuestbookDoor() {
  return (
    <div className="tube animate-tube-on max-w-2xl bg-amber-glass px-5 py-5 font-tube text-xl leading-6 text-signal uppercase sm:px-7">
      <p className="text-2xl">The station guestbook</p>
      <p className="mt-2 normal-case opacity-85">One line, signed with your name, kept on file for every visitor after you.</p>
      <Link
        href="/guestbook"
        className="mt-4 inline-flex bg-signal px-2 text-amber-glass outline-none [text-shadow:none] focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-amber-glass"
      >
        ▶ Open the book
      </Link>
    </div>
  );
}

/**
 * The channel guide: Mr. P's way around the station, since the set has no
 * header. Each channel tunes on click (or Alt+number), and the sound switch
 * rides along.
 */
function ChannelGuide() {
  const pathname = usePathname();
  const { muted, toggleMuted } = useSound();
  const { effects, toggleEffects } = usePreferences();

  return (
    <nav aria-label="Channels" className="type-osd flex flex-wrap items-center gap-1.5">
      {siteConfig.navigation.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-keyshortcuts={`Alt+${item.shortcut}`}
            className={cn(
              "flex items-center gap-1.5 border border-rule px-2 py-1 text-sm leading-4 outline-none hover:border-osd focus-visible:border-osd focus-visible:ring-2 focus-visible:ring-osd/30",
              active && "border-osd bg-osd text-osd-foreground [text-shadow:none]",
            )}
          >
            <span aria-hidden="true" className="opacity-70">
              0{item.shortcut}
            </span>
            {item.label}
          </Link>
        );
      })}
      {siteConfig.extras.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={item.detail}
          aria-current={pathname === item.href ? "page" : undefined}
          className={cn(
            "border border-dashed border-rule px-2 py-1 text-sm leading-4 text-muted-foreground outline-none hover:border-osd hover:text-foreground focus-visible:border-osd focus-visible:text-foreground",
            pathname === item.href && "border-osd text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        role="switch"
        aria-checked={effects}
        onClick={toggleEffects}
        className="ml-auto flex items-center gap-2 px-2 py-1 text-sm leading-4 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
      >
        <span
          aria-hidden="true"
          className={cn("h-2.5 w-3.5", effects ? "bg-signal shadow-[0_0_8px_var(--signal)]" : "border-[1.5px] border-current")}
        />
        Fx {effects ? "on" : "off"}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={!muted}
        aria-keyshortcuts="Alt+M"
        onClick={toggleMuted}
        className="flex items-center gap-2 px-2 py-1 text-sm leading-4 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
      >
        <span
          aria-hidden="true"
          className={cn("h-2.5 w-3.5", muted ? "border-[1.5px] border-current" : "bg-signal shadow-[0_0_8px_var(--signal)]")}
        />
        Snd {muted ? "off" : "on"}
      </button>
    </nav>
  );
}

function TubeBay({ glass, children }: { glass: string; children: ReactNode }) {
  return (
    <div className={cn("tube animate-tube-on flex aspect-[16/11] max-h-[26rem] min-h-72 w-full max-w-2xl flex-col border border-rule", glass)}>
      {children}
    </div>
  );
}

/** Mounts one instrument under a station reply. */
export function InstrumentMount({
  instrument,
  archive,
  entry,
  onAsk,
}: {
  instrument: Instrument;
  archive: Archive;
  /** The note or project the "file" instrument pulls out. */
  entry?: string;
  onAsk: (question: string) => void;
}) {
  switch (instrument) {
    case "dossier":
      return <Dossier archive={archive} />;
    case "projects":
      return (
        <div className="tube animate-tube-on flex max-h-[22rem] w-full max-w-2xl flex-col border border-rule bg-tube text-tube-foreground">
          <TapeShelf tapes={archive.projects} compact />
        </div>
      );
    case "file":
      return <FileCard archive={archive} href={entry} />;
    case "now":
      return <NowPanel />;
    case "sanctuary":
      return <SanctuaryDoor />;
    case "guestbook":
      return <GuestbookDoor />;
    case "notes":
      return (
        <TubeBay glass="bg-amber-glass text-signal">
          <NotesScope notes={archive.notes} />
        </TubeBay>
      );
    case "game":
      return (
        <div className="flex w-full max-w-2xl flex-col gap-2">
          {/* The bubble is a small screen; the arcade has the whole tube. */}
          <Link
            href="/play"
            className="type-osd self-end border border-rule px-2 py-1 text-sm leading-4 text-muted-foreground outline-none hover:border-osd hover:bg-osd hover:text-osd-foreground focus-visible:border-osd focus-visible:bg-osd focus-visible:text-osd-foreground"
          >
            ⛶ Play full screen in the arcade
          </Link>
          <div className="tube animate-tube-on h-[clamp(12rem,calc(100dvh-36.5rem),18rem)] w-full border border-rule bg-tube text-tube-foreground">
            <StarCatcher
              onReport={(score) => onAsk(`I scored ${score} in Star Catcher!`)}
              onRecord={(score) => onAsk(`I just set the Star Catcher record: ${score}!`)}
            />
          </div>
        </div>
      );
    case "transmit":
      return <Transmitter />;
    case "channels":
      return <ChannelGuide />;
  }
}
