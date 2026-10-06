import type { ReactNode } from "react";
import Link from "next/link";
import { Leader } from "@/components/leader";
import { formatEntryDate, type ContentEntry } from "@/lib/content";
import { sectionDetails } from "@/lib/site";

/**
 * Articles play back on the tube as a case file, annotated by the archivist's
 * red pen.
 */
export function MdxArticle({ children, entry }: { children: ReactNode; entry: ContentEntry }) {
  const section = sectionDetails[entry.section];
  const showContents = entry.headings.length >= 2;

  return (
    <div className="flex flex-1 flex-col px-2 pb-16 sm:px-6 lg:px-10">
      <div className="sticky top-0 z-10 bg-background pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <p className="type-label flex justify-between gap-4 px-1 text-muted-foreground">
          <Link href={`/${entry.section}`} className="outline-none hover:text-foreground focus-visible:text-foreground">
            ◂ Back to {section.title}{" "}
            <span className="hidden sm:inline">(Esc)</span>
          </Link>
          <span className="truncate">{entry.href}</span>
        </p>
      </div>

      <article className="animate-tube-on mx-auto mt-4 w-full max-w-4xl border border-rule bg-surface/60 px-5 pt-8 pb-14 shadow-[inset_0_0_4rem_rgb(0_0_0/0.5)] sm:px-12 sm:pt-12">
        <header className="relative">
          <div className="type-label flex justify-between gap-4 text-muted-foreground">
            <span>
              Sheet {section.index} · {section.title}
            </span>
            <time dateTime={entry.publishedAt}>{formatEntryDate(entry.publishedAt)}</time>
          </div>

          <h1 className="mt-10 max-w-3xl font-osd text-4xl leading-[1] text-balance uppercase sm:text-6xl">
            {entry.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base/7 text-muted-foreground sm:text-lg/8">{entry.summary}</p>

          <dl className="mt-8 grid gap-x-12 sm:grid-cols-2">
            <Leader label="Filed">{formatEntryDate(entry.publishedAt)}</Leader>
            {entry.updatedAt && <Leader label="Revised">{formatEntryDate(entry.updatedAt)}</Leader>}
            {entry.role && <Leader label="Role">{entry.role}</Leader>}
            {entry.stack.length > 0 && <Leader label="Stack">{entry.stack.join(" · ")}</Leader>}
            {entry.externalUrl && (
              <Leader label="Live">
                <a href={entry.externalUrl} className="underline decoration-dotted underline-offset-4 outline-none hover:text-osd focus-visible:text-osd">
                  {new URL(entry.externalUrl).host} ↗
                </a>
              </Leader>
            )}
            {entry.repoUrl && (
              <Leader label="Source">
                <a href={entry.repoUrl} className="underline decoration-dotted underline-offset-4 outline-none hover:text-osd focus-visible:text-osd">
                  {new URL(entry.repoUrl).host} ↗
                </a>
              </Leader>
            )}
            {entry.tags.length > 0 && (
              <Leader label="Tags">
                {entry.tags.map((tag) => (
                  <span key={tag} className="ml-1.5 bg-sunken px-1">
                    #{tag}
                  </span>
                ))}
              </Leader>
            )}
          </dl>

          {showContents && (
            <nav aria-label="On this sheet" className="mt-8">
              <p className="type-label text-muted-foreground">On this sheet</p>
              <ol className="mt-2 flex flex-col">
                {entry.headings.map((heading, index) => (
                  <li key={heading.id} className={heading.depth === 3 ? "pl-6" : undefined}>
                    <a
                      href={`#${heading.id}`}
                      className="flex gap-3 text-sm leading-7 outline-none hover:text-osd focus-visible:text-osd"
                    >
                      <span className="w-6 shrink-0 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                      {heading.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </header>

        <div className="mt-10 max-w-[40rem] sm:mt-12">{children}</div>

        <p className="type-label mt-16 border-t border-dashed pt-4 text-center text-muted-foreground">
          End of tape · Esc steps back · j / k to scroll
        </p>
      </article>
    </div>
  );
}
