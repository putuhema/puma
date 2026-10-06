import { notFound } from "next/navigation";
import { getEntries, getEntry } from "@/lib/content";
import { ogSize, stationCard } from "@/lib/og";
import { sectionDetails } from "@/lib/site";

export const alt = "A still from the station: the title on black CRT glass";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getEntries().map((entry) => ({ section: entry.section, slug: entry.slug }));
}

/** Each note and project shares as a still from the tape. */
export default async function Image({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const entry = getEntry(section, slug);
  if (!entry) notFound();

  return stationCard({
    kicker: `${sectionDetails[entry.section].title} · ${entry.publishedAt}`,
    title: entry.title,
    summary: entry.summary,
  });
}
