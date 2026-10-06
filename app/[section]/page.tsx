import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesScope } from "@/components/notes-scope";
import { TapeLibrary } from "@/components/tape-library";
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

/** Channels 02 and 03: the notes scope and the tape library, each on its own tube. */
export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  if (!isContentSection(section)) notFound();

  if (section === "books") {
    return (
      <TubeScreen channel="03" label="Tapes" glass="blue">
        <TapeLibrary
          books={getEntries("books").map(({ href, title, author, bookYear, readingStatus, summary }) => ({
            href,
            title,
            author,
            bookYear,
            readingStatus,
            summary,
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
