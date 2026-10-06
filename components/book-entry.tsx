import { Leader } from "@/components/leader";
import type { ContentEntry } from "@/lib/content";

/** The case-file rows a book's review carries above the text. */
export function BookEntry({ entry }: { entry: ContentEntry }) {
  return (
    <>
      <Leader label="Author">{entry.author}</Leader>
      <Leader label="Published">{entry.bookYear}</Leader>
      <Leader label="Status">
        <span className="relative inline-block px-1 after:absolute after:-inset-x-2 after:-inset-y-1 after:rotate-[-3deg] after:rounded-[50%] after:border-[1.5px] after:border-stamp">
          {entry.readingStatus}
        </span>
      </Leader>
      {entry.externalUrl && (
        <Leader label="Publisher">
          <a
            href={entry.externalUrl}
            rel="noreferrer"
            target="_blank"
            className="text-osd underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Visit ↗
          </a>
        </Leader>
      )}
    </>
  );
}
