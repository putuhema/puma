import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesScope } from "@/components/notes-scope";
import { TapeShelf } from "@/components/tape-shelf";
import { TubeScreen } from "@/components/tube-screen";
import { getEntries } from "@/lib/content";
import {
  contentSections,
  isContentSection,
  sectionDetails,
  siteConfig,
} from "@/lib/site";

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return contentSections.map((section) => ({ section }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  if (!isContentSection(section)) return {};
  const details = sectionDetails[section];

  return {
    title: details.title,
    description: details.description,
    alternates: { canonical: `/${section}` },
    openGraph: {
      title: `${details.title} — ${siteConfig.name}`,
      description: details.description,
      url: `/${section}`,
    },
  };
}

/** Channel 02: the notes scope, on amber glass. Channel 04: the tape shelf. */
export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  if (!isContentSection(section)) notFound();

  if (section === "projects") {
    return (
      <TubeScreen channel="04" label="Projects" glass="black">
        <TapeShelf
          tapes={getEntries("projects").map(({ href, slug, title, publishedAt, summary, stack }) => ({
            href,
            slug,
            title,
            publishedAt,
            summary,
            stack,
          }))}
        />
      </TubeScreen>
    );
  }

  return (
    <TubeScreen channel="02" label="Notes" glass="amber">
      <NotesScope
        notes={getEntries("notes").map(({ href, slug, title, publishedAt }) => ({ href, slug, title, publishedAt }))}
      />
    </TubeScreen>
  );
}
