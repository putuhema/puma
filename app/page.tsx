import { TransmissionDesk } from "@/components/transmission-desk";
import { getEntries } from "@/lib/content";
import type { Archive } from "@/lib/transmission";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { ask } = await searchParams;

  const archive: Archive = {
    books: getEntries("books").map(({ href, title, author, bookYear, readingStatus, summary }) => ({
      href,
      title,
      author,
      bookYear,
      readingStatus,
      summary,
    })),
    notes: getEntries("notes").map(({ href, slug, title, publishedAt, summary }) => ({
      href,
      slug,
      title,
      publishedAt,
      summary,
    })),
  };

  return (
    <TransmissionDesk
      archive={archive}
      initialAsk={typeof ask === "string" ? ask.slice(0, 200) : undefined}
    />
  );
}
