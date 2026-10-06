"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrackingBar } from "@/components/instruments";
import { useSfx } from "@/components/sound-control";
import type { ArchiveBook } from "@/lib/transmission";
import { cn } from "@/lib/utils";

/** Channel 03: the book shelf as a VCR's on-screen menu. ↑↓ to pick, Enter to play. */
export function TapeLibrary({ books }: { books: ArchiveBook[] }) {
  const router = useRouter();
  const sound = useSfx();
  const [selected, setSelected] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const current = books[selected];

  useEffect(() => {
    function operateMenu(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || books.length === 0) return;
      // Typing somewhere (Mr. P's chat box) isn't steering the menu.
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        sound.key();
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next = (selected + step + books.length) % books.length;
        setSelected(next);
        list.current?.querySelectorAll<HTMLAnchorElement>("a")[next]?.focus({ preventScroll: true });
      } else if (event.key === "Enter" && !(event.target instanceof HTMLAnchorElement) && current) {
        router.push(current.href);
      }
    }

    window.addEventListener("keydown", operateMenu);
    return () => window.removeEventListener("keydown", operateMenu);
  }, [books.length, current, router, selected, sound]);

  return (
    <div className="type-osd flex flex-1 flex-col px-6 py-7 sm:px-12 sm:py-10">
      <h1 className="bg-osd-foreground py-1 text-center text-xl leading-8 text-osd [text-shadow:none] sm:text-3xl sm:leading-10">
        VHS · Tape library
      </h1>

      {books.length === 0 ? (
        <p className="mt-8 text-lg leading-8">No tapes loaded</p>
      ) : (
        <ol ref={list} className="mt-8 flex flex-col gap-6">
          {books.map((book, index) => (
            <li key={book.href}>
              <Link
                href={book.href}
                onMouseEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
                className="flex flex-col gap-1.5 outline-none"
              >
                <span
                  className={cn(
                    "self-start px-1.5 text-lg leading-7 sm:text-xl",
                    index === selected && "bg-osd-foreground text-osd [text-shadow:none]",
                  )}
                >
                  {index === selected ? "▶" : "■"} {book.title}
                </span>
                <span className="px-1.5 text-sm leading-5 opacity-85">
                  {[book.author, book.bookYear, book.readingStatus].filter(Boolean).join(" · ")}
                </span>
                {index === selected && (
                  <span className="max-w-xl px-1.5 font-tube text-xl leading-6 normal-case">{book.summary}</span>
                )}
                <span className="px-1.5">
                  <TrackingBar status={book.readingStatus} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {current && (
        <div aria-hidden="true" className="mt-auto pt-12">
          <div className="flex items-end justify-between text-lg">
            <span>
              Tape {String(selected + 1).padStart(2, "0")}/{String(books.length).padStart(2, "0")}
            </span>
            <span>{current.readingStatus}</span>
          </div>
          <div className="relative mt-3 h-6 border-2 border-current">
            <span
              className="absolute -top-5 -translate-x-1/2 text-base leading-4 transition-[left] duration-150 motion-reduce:transition-none"
              style={{ left: `${((selected + 0.5) / books.length) * 100}%` }}
            >
              ▼
            </span>
            <span
              className="absolute inset-y-0 left-0 bg-current transition-[width] duration-150 motion-reduce:transition-none"
              style={{ width: `${((selected + 0.5) / books.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-base">
            <span>Begin</span>
            <span>End</span>
          </div>
        </div>
      )}

      <p className={cn("text-sm leading-6", current ? "mt-8" : "mt-auto")}>
        Select with (▲▼) and <span className="bg-osd-foreground px-1 text-osd [text-shadow:none]">⏎</span> to play
      </p>
    </div>
  );
}
