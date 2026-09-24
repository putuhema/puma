import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LibraryReader } from "@/components/library-reader";
import { getEntries } from "@/lib/content";
import { librarySidebarCookie } from "@/lib/site";

export default async function SectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (section !== "notes" && section !== "books") return children;

  const cookieStore = await cookies();
  const initialSidebarOpen =
    cookieStore.get(librarySidebarCookie)?.value !== "closed";
  const entries = getEntries(section).map(({ href, slug, title }) => ({
    href,
    slug,
    title,
  }));

  return (
    <LibraryReader
      entries={entries}
      initialSidebarOpen={initialSidebarOpen}
      section={section}
    >
      {children}
    </LibraryReader>
  );
}
