import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookEntry } from "@/components/book-entry";
import { formatEntryDate, type ContentEntry } from "@/lib/content";
import { sectionDetails } from "@/lib/site";
import { cn } from "@/lib/utils";

export function MdxArticle({
  children,
  entry,
  reader = false,
}: {
  children: ReactNode;
  entry: ContentEntry;
  reader?: boolean;
}) {
  const section = sectionDetails[entry.section];
  const showContents = entry.headings.length >= 2;

  return (
    <article
      className={cn(
        "mx-auto w-full px-5 sm:px-10",
        reader
          ? "max-w-5xl pb-36 pt-20 sm:pt-24 lg:px-14"
          : "max-w-7xl py-10 sm:py-16 lg:px-12 lg:py-20",
      )}
    >
      <div
        className={cn(
          reader
            ? "mx-auto max-w-3xl"
            : "grid gap-12 xl:grid-cols-[minmax(0,44rem)_14rem] xl:justify-center xl:gap-20",
        )}
      >
        <div className="min-w-0">
          {!reader && (
            <Link
              className="inline-flex items-center gap-2 rounded-sm text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground outline-none transition-colors duration-150 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              href={`/${entry.section}`}
            >
              <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
              {section.title}
            </Link>
          )}

          <header className={reader ? undefined : "mt-9"}>
            <div className="flex flex-wrap items-center gap-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {!reader && <span>{section.index}</span>}
              {!reader && <span aria-hidden="true">/</span>}
              <time dateTime={entry.publishedAt}>{formatEntryDate(entry.publishedAt)}</time>
              {entry.updatedAt && <span>Updated {formatEntryDate(entry.updatedAt)}</span>}
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[0.98] tracking-[-0.045em] text-balance sm:text-6xl">
              {entry.title}
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-xl/8 text-muted-foreground italic">
              {entry.summary}
            </p>
            {entry.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {entry.section === "books" && <BookEntry entry={entry} />}
          </header>

          <div className="mt-12 max-w-[42rem] sm:mt-16">{children}</div>
        </div>

        {!reader && showContents && (
          <aside className="hidden xl:block">
            <nav aria-label="On this page" className="sticky top-12 border-l pl-6">
              <p className="mb-5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                On this page
              </p>
              <ol className="flex flex-col gap-3">
                {entry.headings.map((heading) => (
                  <li className={heading.depth === 3 ? "pl-3" : undefined} key={heading.id}>
                    <a
                      className="block text-sm/5 text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
                      href={`#${heading.id}`}
                    >
                      {heading.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
      </div>
    </article>
  );
}
