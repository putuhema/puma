import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EntryList } from "@/components/entry-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
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

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  if (!isContentSection(section)) notFound();

  const details = sectionDetails[section];
  const entries = getEntries(section);

  if (section === "notes" || section === "books") {
    const firstEntry = entries[0];
    if (firstEntry) redirect(firstEntry.href);

    return (
      <main className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-4xl items-center px-5 py-20 sm:px-10">
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyTitle>This chapter is still open.</EmptyTitle>
            <EmptyDescription>
              Add an MDX file to <code>content/{section}</code> and its title will appear in the sidebar.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
      <header className="grid gap-7 sm:grid-cols-[5rem_minmax(0,1fr)]">
        <span className="pt-2 text-xs font-medium tracking-[0.18em] text-primary">
          {details.index}
        </span>
        <div>
          <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] sm:text-7xl">
            {details.title}
          </h1>
          <p className="mt-5 max-w-xl font-serif text-xl/8 text-muted-foreground">
            {details.description}
          </p>
        </div>
      </header>

      <div className="mt-12 sm:mt-16 sm:pl-20">
        <EntryList entries={entries} section={section} />
      </div>
    </div>
  );
}
