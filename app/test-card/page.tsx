import type { Metadata } from "next";
import Link from "next/link";
import { Leader } from "@/components/leader";
import { StationReadout } from "@/components/station-readout";
import { getArchive } from "@/lib/content";
import { siteConfig } from "@/lib/site";

const description = "Channel 00: the test card, and how this station was built.";

export const metadata: Metadata = {
  title: "Test card",
  description,
  alternates: { canonical: "/test-card" },
  openGraph: { title: `Test card — ${siteConfig.name}`, description, url: "/test-card" },
};

/** SMPTE colour bars, top to bottom: the main bars, the castellations, the pluge. */
const bars = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
const castellations = ["#0000c0", "#131313", "#c000c0", "#131313", "#00c0c0", "#131313", "#c0c0c0"];
const pluge = [
  { color: "#00214c", grow: 5 },
  { color: "#ffffff", grow: 5 },
  { color: "#32006a", grow: 5 },
  { color: "#131313", grow: 5 },
  { color: "#090909", grow: 1.67 },
  { color: "#131313", grow: 1.67 },
  { color: "#1d1d1d", grow: 1.66 },
  { color: "#131313", grow: 5 },
];

const colophon: [string, string][] = [
  ["Framework", "Next.js 16, React 19, the App Router"],
  ["Live channels", "Convex: the Sanctuary, guestbook, high scores, who's tuned in"],
  ["Mr. P", "Three.js, rendered small and blown up into a bitmap"],
  ["Motion", "Motion for the bubbles, CSS for the tube"],
  ["Words", "MDX files, read at build time"],
  ["Sound", "Synthesised live with the Web Audio API, no samples"],
  ["Glass", "An SVG displacement map bends the raster (Alt+B bends the picture)"],
  ["Type", "VT323, Silkscreen, IBM Plex Mono, IBM Plex Sans Condensed"],
  ["Styling", "Tailwind CSS 4"],
];

/**
 * Channel 00: SMPTE bars with the station ident, then the colophon, the
 * set's knobs, and the live status. Where the curious find out how it works.
 */
export default function TestCardPage() {
  return (
    <div className="flex flex-1 flex-col px-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-16 sm:px-6 lg:px-10 lg:pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <p className="type-label flex justify-between gap-4 px-1 text-muted-foreground">
        <Link href="/" className="outline-none hover:text-foreground focus-visible:text-foreground">
          ◂ Back to the station <span className="hidden sm:inline">(Esc)</span>
        </Link>
        <span>CH 00</span>
      </p>

      <section aria-label="Test card" className="tube animate-tube-on relative mx-auto mt-4 aspect-[4/3] w-full max-w-4xl [text-shadow:none] sm:aspect-video">
        <div aria-hidden="true" className="flex h-[67%]">
          {bars.map((color) => (
            <span key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
        <div aria-hidden="true" className="flex h-[8%]">
          {castellations.map((color, index) => (
            <span key={index} className="flex-1" style={{ background: color }} />
          ))}
        </div>
        <div aria-hidden="true" className="flex h-[25%]">
          {pluge.map((band, index) => (
            <span key={index} style={{ background: band.color, flexGrow: band.grow, flexBasis: 0 }} />
          ))}
        </div>
        {/* The station ident, dead centre. */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid aspect-square w-[34%] place-items-center rounded-full border-4 border-white bg-black/85 text-center font-tube text-white uppercase">
            <div>
              <p className="text-[clamp(1.5rem,5vw,3.5rem)] leading-none">P-4</p>
              <p className="text-[clamp(0.75rem,1.6vw,1.25rem)] leading-tight">{siteConfig.name} · ch 00</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 grid w-full max-w-4xl gap-10 sm:grid-cols-[1fr_14rem]">
        <article>
          <h1 className="font-osd text-3xl leading-none uppercase sm:text-4xl">Colophon</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Field Station P-4 is a portfolio that plays like a tape on a CRT. Here&rsquo;s what&rsquo;s inside the set.
            The full story is on <Link href="/projects/field-station-p4" className="text-foreground underline decoration-dotted underline-offset-4">its tape</Link>.
          </p>
          <dl className="mt-6">
            {colophon.map(([label, value]) => (
              <Leader key={label} label={label}>
                {value}
              </Leader>
            ))}
          </dl>

          <h2 className="type-label mt-10 text-muted-foreground">The set&rsquo;s knobs</h2>
          <dl className="mt-2">
            <Leader label="/effects">Scanlines, glow and static on or off</Leader>
            <Leader label="/theme">Phosphor: white, green or amber</Leader>
            <Leader label="Alt M · /mute">Sound</Leader>
            <Leader label="Alt B">Bend the picture through the lens</Leader>
            <Leader label="?">The whole keyboard map, on the chat</Leader>
          </dl>
        </article>

        <aside>
          <h2 className="type-label text-muted-foreground">Status</h2>
          <StationReadout archive={getArchive()} className="mt-2 text-xs leading-5" />
        </aside>
      </div>
    </div>
  );
}
