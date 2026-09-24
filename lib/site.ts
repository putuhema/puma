export const contentSections = ["notes", "essays", "books", "projects"] as const;

export type ContentSection = (typeof contentSections)[number];

export const sectionDetails: Record<
  ContentSection,
  { title: string; description: string; index: string }
> = {
  notes: {
    title: "Notes",
    description: "Small observations, useful fragments, and things worth remembering.",
    index: "01",
  },
  essays: {
    title: "Essays",
    description: "Longer attempts to understand design, work, and an attentive life.",
    index: "02",
  },
  books: {
    title: "Books",
    description: "A reading ledger: what is open, what stayed, and what changed my mind.",
    index: "03",
  },
  projects: {
    title: "Projects",
    description: "Selected experiments, tools, and works in progress.",
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
    { label: "Home", href: "/", index: "00" },
    ...contentSections.map((section) => ({
      label: sectionDetails[section].title,
      href: `/${section}`,
      index: sectionDetails[section].index,
    })),
  ],
  links: [
    { label: "Email", href: "mailto:hello@example.com" },
    { label: "RSS", href: "/feed.xml" },
  ],
} as const;
