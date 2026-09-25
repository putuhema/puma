export const contentSections = ["notes", "books", "playground"] as const;

export type ContentSection = (typeof contentSections)[number];

export const librarySidebarCookie = "puma_library_sidebar";

export const sectionDetails: Record<
  ContentSection,
  { title: string; description: string; index: string }
> = {
  notes: {
    title: "Notes",
    description: "Small observations, useful fragments, and things worth remembering.",
    index: "02",
  },
  books: {
    title: "Books",
    description: "A reading ledger: what is open, what stayed, and what changed my mind.",
    index: "03",
  },
  playground: {
    title: "The Dragon Index",
    description: "A comparative encyclopedia of dragons, ordered from smallest to largest.",
    index: "04",
  },
};

export function isContentSection(value: string): value is ContentSection {
  return contentSections.includes(value as ContentSection);
}

export const siteConfig = {
  name: "puma",
  author: "Puma",
  description: "A web developer who loves to build stuff.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  navigation: [
    { label: "Home", href: "/", shortcut: "1" },
    { label: "Notes", href: "/notes", shortcut: "2" },
    { label: "Books", href: "/books", shortcut: "3" },
    { label: "Dragons", href: "/playground", shortcut: "4" },
  ],
  links: [
    { label: "Email", href: "mailto:hello@example.com" },
    { label: "RSS", href: "/feed.xml" },
  ],
} as const;
