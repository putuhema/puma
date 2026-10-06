import type { Metadata } from "next";
import Link from "next/link";
import { getEntries } from "@/lib/content";
import { formatEntryDate } from "@/lib/format";
import { now, siteConfig } from "@/lib/site";

const description = "The P-4 TV guide: what's on every channel, and every note and project as an episode.";

export const metadata: Metadata = {
  title: "TV guide",
  description,
  alternates: { canonical: "/guide" },
  openGraph: { title: `TV guide — ${siteConfig.name}`, description, url: "/guide" },
};

/**
 * The station's TV guide: tonight's line-up on each channel, then every
 * note and project listed as an episode with its running time.
 */
export default function GuidePage() {
  const notes = getEntries("notes");
  const projects = getEntries("projects");
  const episodes = [...projects, ...notes].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const lineUp = [
    { channel: "01", href: "/", title: "Mr. P, live", blurb: "The station's host takes your questions. Unscripted, mostly." },
    {
      channel: "02",
      href: "/notes",
      title: "Notes",
      blurb: notes[0] ? `${notes.length} on the scope. Latest: “${notes[0].title}”.` : "Nothing filed yet.",
    },
    { channel: "03", href: "/sanctuary", title: "The Sanctuary", blurb: "Live phone-in. Visitors talk to each other in real time." },
    {
      channel: "04",
      href: "/projects",
      title: "Projects",
      blurb: projects[0] ? `${projects.length} on the shelf. Featured: “${projects[0].title}”.` : "The shelf is empty.",
    },
    { channel: "00", href: "/test-card", title: "Test card", blurb: "Colour bars and the story of how the station was built." },
  ];

  return (
    <div className="flex flex-1 flex-col px-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-16 sm:px-6 lg:px-10 lg:pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <p className="type-label flex justify-between gap-4 px-1 text-muted-foreground pointer-coarse:pr-14">
        <Link href="/" className="outline-none hover:text-foreground focus-visible:text-foreground">
          ◂ Back to the station <span className="hidden sm:inline">(Esc)</span>
        </Link>
        <span>Listings as of {formatEntryDate(now.updatedAt)}</span>
      </p>

      <article className="animate-tube-on mx-auto mt-4 w-full max-w-4xl bg-amber-glass px-5 py-6 font-tube text-xl leading-6 text-signal sm:px-10 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-current pb-3">
          <h1 className="text-5xl leading-none uppercase sm:text-6xl">TV guide</h1>
          <p className="uppercase opacity-80">Field Station P-4 · all week</p>
        </header>

        <h2 className="mt-6 bg-signal px-2 text-2xl text-amber-glass uppercase [text-shadow:none]">On the dial</h2>
        <ul className="mt-2">
          {lineUp.map((slot) => (
            <li key={slot.channel}>
              <Link
                href={slot.href}
                className="group grid grid-cols-[3.5rem_1fr] gap-x-4 border-b border-dashed border-current/40 py-2.5 outline-none hover:bg-signal/10 focus-visible:bg-signal/10 sm:grid-cols-[3.5rem_14rem_1fr]"
              >
                <span className="text-3xl leading-7">{slot.channel}</span>
                <span className="text-2xl uppercase group-hover:underline group-focus-visible:underline">{slot.title}</span>
                <span className="col-start-2 normal-case opacity-85 sm:col-start-3">{slot.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 bg-signal px-2 text-2xl text-amber-glass uppercase [text-shadow:none]">Episodes</h2>
        {episodes.length === 0 ? (
          <p className="mt-2">No episodes yet.</p>
        ) : (
          <ol className="mt-2">
            {episodes.map((episode, index) => (
              <li key={episode.href}>
                <Link
                  href={episode.href}
                  className="group grid grid-cols-[5rem_1fr_auto] items-baseline gap-x-4 border-b border-dashed border-current/40 py-2.5 outline-none hover:bg-signal/10 focus-visible:bg-signal/10"
                >
                  <span className="opacity-70">E{String(episodes.length - index).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block uppercase group-hover:underline group-focus-visible:underline">{episode.title}</span>
                    <span className="block text-lg leading-5 normal-case opacity-75">
                      {episode.section === "projects" ? "Project" : "Note"} · {formatEntryDate(episode.publishedAt)}
                    </span>
                  </span>
                  <span className="opacity-80">{episode.readingMinutes} min</span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-8 text-lg uppercase opacity-70">
          Off the dial: <Link href="/play" className="underline-offset-4 hover:underline">Arcade</Link> ·{" "}
          <Link href="/guestbook" className="underline-offset-4 hover:underline">Guestbook</Link> ·{" "}
          <Link href="/teletext" className="underline-offset-4 hover:underline">Teletext</Link> ·{" "}
          <Link href="/passport" className="underline-offset-4 hover:underline">Passport</Link>
        </p>
      </article>
    </div>
  );
}
