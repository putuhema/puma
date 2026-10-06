"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Leader } from "@/components/leader";
import { NotesScope } from "@/components/notes-scope";
import { StarCatcher } from "@/components/star-catcher";
import type { ReadingStatus } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { softKeys, type Archive, type Instrument } from "@/lib/transmission";
import { cn } from "@/lib/utils";

const trackingLength = 16;

/** How far along the tape is wound: finished is full, queued is blank. */
const trackingByStatus: Record<ReadingStatus, number> = {
  finished: trackingLength,
  reading: trackingLength / 2,
  queued: 0,
};

export function TrackingBar({ status }: { status?: ReadingStatus }) {
  const filled = status ? trackingByStatus[status] : 0;

  return (
    <span aria-hidden="true" className="flex h-3 items-center gap-[3px]">
      {Array.from({ length: trackingLength }, (_, index) => (
        <span key={index} className={index < filled ? "h-full w-1.5 bg-current" : "h-0.5 w-1.5 bg-current"} />
      ))}
    </span>
  );
}

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
            <Leader label="Role">Web developer</Leader>
            <Leader label="Known for">Loves to build stuff</Leader>
            <Leader label="Status">
              <span className="relative inline-block px-1 after:absolute after:-inset-x-2 after:-inset-y-1 after:rotate-[-3deg] after:rounded-[50%] after:border-[1.5px] after:border-stamp">
                Away from desk
              </span>
            </Leader>
            <Leader label="On file">
              {archive.notes.length} notes · {archive.books.length} tapes
            </Leader>
          </dl>
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

function TapeDeck({ archive }: { archive: Archive }) {
  const [selected, setSelected] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const { books } = archive;

  // ↑ / ↓ move between tapes like the VCR menu; Enter plays the review.
  function scrub(event: KeyboardEvent<HTMLOListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    const next = (selected + step + books.length) % books.length;
    setSelected(next);
    list.current?.querySelectorAll<HTMLAnchorElement>("a")[next]?.focus();
  }

  return (
    <div className="tube animate-tube-on type-osd max-w-2xl bg-osd px-5 py-5 text-osd-foreground sm:px-7">
      <p className="bg-osd-foreground py-0.5 text-center text-lg leading-7 text-osd">VHS · Tape library</p>
      {books.length === 0 ? (
        <p className="mt-5">No tapes loaded</p>
      ) : (
        <ol ref={list} onKeyDown={scrub} className="mt-5 flex flex-col gap-4">
          {books.map((book, index) => (
            <li key={book.href}>
              <Link
                href={book.href}
                onMouseEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
                className="flex flex-col gap-1 outline-none"
              >
                <span className={cn("self-start px-1.5 text-base leading-6", index === selected && "bg-osd-foreground text-osd")}>
                  {index === selected ? "▶" : "■"} {book.title}
                </span>
                <span className="px-1.5 text-xs leading-5 opacity-85">
                  {[book.author, book.bookYear, book.readingStatus].filter(Boolean).join(" · ")}
                </span>
                <span className="px-1.5">
                  <TrackingBar status={book.readingStatus} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-5 text-xs leading-5">
        Select with (▲▼) and <span className="bg-osd-foreground px-1 text-osd">OK</span> to play the review
      </p>
    </div>
  );
}

function Transmitter() {
  const [sent, setSent] = useState(false);
  const email = siteConfig.links.find((link) => link.label === "Email")?.href ?? "mailto:";

  function transmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const from = String(form.get("from") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Message for ${siteConfig.author}${from ? ` from ${from}` : ""}`);
    const mailto = document.createElement("a");
    mailto.href = `${email}?subject=${subject}&body=${encodeURIComponent(message)}`;
    mailto.click();
    setSent(true);
  }

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
        <span className={cn(sent ? "" : "animate-lamp")}>{sent ? "Handed off" : "Ready"}</span>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <label className="flex flex-col gap-1.5">
          <span className="type-label text-muted-foreground">Call sign (your name)</span>
          <input
            name="from"
            autoComplete="name"
            className="h-11 border bg-background px-3 text-base outline-none focus-visible:border-osd focus-visible:ring-2 focus-visible:ring-osd/30"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="type-label text-muted-foreground">Message</span>
          <textarea
            name="message"
            required
            rows={4}
            className="resize-y border bg-background bg-[linear-gradient(transparent_1.6rem,var(--rule)_1.6rem,var(--rule)_calc(1.6rem+1px),transparent_calc(1.6rem+1px))] bg-[length:100%_1.65rem] px-3 py-1 text-base leading-[1.65rem] outline-none focus-visible:border-osd focus-visible:ring-2 focus-visible:ring-osd/30"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Opens your mail client, addressed to the operator.</p>
          <button
            type="submit"
            className="key flex h-11 items-center gap-2 bg-osd px-4 text-[0.8125rem] font-medium text-osd-foreground uppercase outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-osd"
          >
            ⌘⏎ Transmit
          </button>
        </div>
      </div>
    </form>
  );
}

/** Things to say back, like an NPC's dialogue choices. */
function CommandIndex({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    <nav aria-label="Things to say" className="border-t border-rule pt-4">
      <ul className="flex flex-col gap-1">
        {softKeys.map((softKey) => (
          <li key={softKey.key}>
            <button
              type="button"
              onClick={() => onAsk(softKey.ask)}
              className="group flex w-full items-baseline gap-2 px-1 py-0.5 text-left font-tube text-xl leading-7 outline-none hover:bg-osd hover:text-osd-foreground focus-visible:bg-osd focus-visible:text-osd-foreground"
            >
              <span aria-hidden="true" className="invisible text-signal group-hover:visible group-focus-visible:visible">
                ▶
              </span>
              {softKey.ask}
            </button>
          </li>
        ))}
      </ul>
      <p className="type-label mt-3 text-muted-foreground">…or say anything below</p>
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
  onAsk,
}: {
  instrument: Instrument;
  archive: Archive;
  onAsk: (question: string) => void;
}) {
  switch (instrument) {
    case "dossier":
      return <Dossier archive={archive} />;
    case "tapes":
      return <TapeDeck archive={archive} />;
    case "notes":
      return (
        <TubeBay glass="bg-amber-glass text-signal">
          <NotesScope notes={archive.notes} />
        </TubeBay>
      );
    case "game":
      return (
        <div className="tube animate-tube-on h-[clamp(12rem,calc(100dvh-36.5rem),18rem)] w-full max-w-2xl border border-rule bg-tube text-tube-foreground">
          <StarCatcher onReport={(score) => onAsk(`I scored ${score} in Star Catcher!`)} />
        </div>
      );
    case "transmit":
      return <Transmitter />;
    case "commands":
      return <CommandIndex onAsk={onAsk} />;
  }
}
