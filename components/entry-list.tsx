import Link from "next/link";
import { BookOpenIcon, ExternalLinkIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatEntryDate, type ContentEntry } from "@/lib/content";
import { sectionDetails, type ContentSection } from "@/lib/site";

export function EntryList({
  entries,
  section,
}: {
  entries: ContentEntry[];
  section: ContentSection;
}) {
  if (entries.length === 0) {
    return (
      <Empty className="min-h-80 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpenIcon />
          </EmptyMedia>
          <EmptyTitle>This chapter is still open.</EmptyTitle>
          <EmptyDescription>
            Add an MDX file to <code>content/{section}</code> and it will appear here at the next build.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, index) => (
        <div key={entry.href}>
          {index > 0 && <Separator />}
          <article className="group grid gap-4 py-7 sm:grid-cols-[7rem_minmax(0,1fr)] sm:py-9">
            <time
              className="type-label pt-1 text-muted-foreground"
              dateTime={entry.publishedAt}
            >
              {formatEntryDate(entry.publishedAt)}
            </time>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-3xl leading-8 sm:text-4xl sm:leading-9">
                  <Link
                    className="rounded-sm outline-none transition-colors duration-150 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                    href={entry.href}
                  >
                    {entry.title}
                  </Link>
                </h2>
                {entry.externalUrl && (
                  <ExternalLinkIcon
                    className="mt-1 size-3.5 shrink-0 text-muted-foreground"
                    aria-label="Includes an external reference"
                  />
                )}
              </div>
              <p className="max-w-2xl text-sm/6 text-muted-foreground">
                {entry.summary}
              </p>
              {section === "books" && entry.author && (
                <p className="type-label text-muted-foreground">
                  {entry.author} · {entry.bookYear}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {entry.readingStatus && (
                  <Badge variant="outline" className="type-label border-stamp text-stamp">{entry.readingStatus}</Badge>
                )}
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="type-label text-muted-foreground">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </article>
        </div>
      ))}
      <p className="type-label mt-8 text-muted-foreground">
        {entries.length} {entries.length === 1 ? "entry" : "entries"} in {sectionDetails[section].title.toLowerCase()}
      </p>
    </div>
  );
}
