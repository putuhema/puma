import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/site";
import { maxStillLength, verifyLine } from "@/lib/still";

type SaidProps = { searchParams: Promise<{ l?: string | string[]; s?: string | string[] }> };

/** The line and its signature from the link, or null if they don't check out. */
async function readLine(searchParams: SaidProps["searchParams"]) {
  const { l, s } = await searchParams;
  const line = typeof l === "string" ? l.slice(0, maxStillLength) : "";
  const signature = typeof s === "string" ? s : "";
  return line && verifyLine(line, signature) ? { line, signature } : null;
}

export async function generateMetadata({ searchParams }: SaidProps): Promise<Metadata> {
  const said = await readLine(searchParams);
  if (!said) return {};
  const image = `/said/image?l=${encodeURIComponent(said.line)}&s=${said.signature}`;
  const description = said.line.length > 160 ? `${said.line.slice(0, 157)}…` : said.line;
  return {
    title: "Mr. P said",
    description,
    robots: { index: false },
    openGraph: {
      title: `Mr. P said — ${siteConfig.name}`,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: `Mr. P said: ${said.line}` }],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

/** A shared line from Mr. P, as a still, with the way in to talk to him. */
export default async function SaidPage({ searchParams }: SaidProps) {
  const said = await readLine(searchParams);
  if (!said) notFound();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element -- a generated still, already the right size */}
      <img
        src={`/said/image?l=${encodeURIComponent(said.line)}&s=${said.signature}`}
        alt={`Mr. P said: ${said.line}`}
        width={1200}
        height={630}
        className="animate-tube-on h-auto w-full max-w-3xl"
      />
      <Link
        href="/"
        className="key type-osd bg-osd px-4 py-2 text-sm text-osd-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-osd"
      >
        ▶ Talk to Mr. P yourself
      </Link>
    </div>
  );
}
