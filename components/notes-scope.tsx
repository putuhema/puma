import Link from "next/link";
import { formatEntryDate } from "@/lib/format";

export type NoteContact = {
  href: string;
  slug: string;
  title: string;
  publishedAt: string;
};

const latitudes = ["40N", "30N", "20N", "10N", "0", "10S"];
const longitudes = Array.from({ length: 9 }, (_, index) => String(20 + index * 2));

/** A stable pseudo-random position for a slug, kept clear of the scope edges. */
function plot(slug: string) {
  let hash = 2166136261;
  for (const character of slug) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return {
    x: 12 + ((hash >>> 0) % 68),
    y: 16 + ((hash >>> 8) % 56),
  };
}

/**
 * Channel 02: notes as contacts on a satellite tracking scope. Each note is
 * plotted where its slug lands; a dashed track joins them oldest to newest.
 */
export function NotesScope({ notes }: { notes: NoteContact[] }) {
  const contacts = notes.map((note) => ({ ...note, ...plot(note.slug) }));
  const track = [...contacts].reverse();
  const latest = notes[0];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col font-tube text-lg leading-5 uppercase sm:text-xl">
      <div
        aria-hidden="true"
        className="absolute inset-y-10 right-14 left-5 sm:right-16 sm:left-8"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--signal) 28%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--signal) 28%, transparent) 1px, transparent 1px)",
          backgroundSize: `${100 / 8}% ${100 / 5}%`,
        }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full opacity-45">
          <path
            d="M8 70 C 20 52, 34 66, 46 50 S 70 30, 92 42"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M14 30 C 26 20, 38 34, 52 24 S 76 14, 88 22 C 80 34, 60 30, 48 38 S 24 44, 14 30 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {track.length > 1 && (
            <polyline
              points={track.map((contact) => `${contact.x},${contact.y}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
              className="opacity-100"
            />
          )}
          {track.length <= 1 && (
            <line
              x1={-4}
              y1={6}
              x2={track[0]?.x ?? 46}
              y2={track[0]?.y ?? 52}
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <ul className="absolute inset-0">
          {contacts.map((contact) => (
            <li
              key={contact.href}
              className="absolute"
              style={{ left: `${contact.x}%`, top: `${contact.y}%` }}
            >
              <Link
                href={contact.href}
                className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
              >
                <span aria-hidden="true" className="block size-4 rotate-45 border-2 border-current group-hover:bg-signal group-focus-visible:bg-signal" />
                <span className="absolute top-1/2 left-7 -translate-y-1/2 border-2 border-current bg-amber-glass px-1.5 whitespace-nowrap group-hover:bg-signal group-hover:text-amber-glass group-focus-visible:bg-signal group-focus-visible:text-amber-glass">
                  {contact.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div aria-hidden="true" className="absolute inset-y-10 right-2 flex w-11 flex-col justify-between text-right sm:right-3">
        {latitudes.map((latitude) => (
          <span key={latitude}>{latitude}</span>
        ))}
      </div>
      <div aria-hidden="true" className="absolute right-14 bottom-2 left-5 flex justify-between sm:right-16 sm:left-8">
        {longitudes.map((longitude) => (
          <span key={longitude}>{longitude}</span>
        ))}
      </div>

      <div className="relative flex items-start justify-between gap-4 px-5 pt-4 sm:px-8">
        <span aria-hidden="true" className="flex gap-2">
          <span className="h-3 w-16 bg-signal" />
          <span className="h-3 w-16 border-2 border-current" />
        </span>
        <p>Tracking scope · notes</p>
      </div>

      <div className="relative mt-auto mb-12 ml-8 self-start border-2 border-current bg-amber-glass px-4 py-2 text-center sm:ml-12">
        {latest ? (
          <>
            <p>Latest contact</p>
            <p className="text-2xl leading-7 sm:text-3xl">{formatEntryDate(latest.publishedAt)}</p>
          </>
        ) : (
          <>
            <p>No contacts</p>
            <p className="animate-lamp text-2xl leading-7 sm:text-3xl">0 notes filed</p>
          </>
        )}
      </div>
    </div>
  );
}
