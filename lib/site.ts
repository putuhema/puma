export const contentSections = ["notes", "projects"] as const;

export type ContentSection = (typeof contentSections)[number];

export const librarySidebarCookie = "puma_library_sidebar";

export const sectionDetails: Record<
  ContentSection,
  { title: string; description: string; index: string }
> = {
  notes: {
    title: "Notes",
    description:
      "Small observations, useful fragments, and things worth remembering.",
    index: "02",
  },
  projects: {
    title: "Projects",
    description: "Things built, shipped, or still on the bench: one tape each.",
    index: "04",
  },
};

export function isContentSection(value: string): value is ContentSection {
  return contentSections.includes(value as ContentSection);
}

export const siteConfig = {
  name: "puma",
  fullname: "Putu Mahendra",
  girlfriend: "Anggraeni Wulandari",
  author: "Puma",
  description: "A web developer who loves to build stuff.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** The day the station first went on air (the first commit). */
  onAirSince: "2026-09-24",
  /**
   * The operator's own clock, shown on the station readout. An IANA zone
   * like "Asia/Makassar"; leave null to keep the readout off the clock.
   */
  timeZone: "Asia/Makassar",
  /** The four channels, in tuning order; `shortcut` is the channel number. */
  navigation: [
    { label: "Chat", href: "/", shortcut: "1" },
    { label: "Notes", href: "/notes", shortcut: "2" },
    { label: "Sanctuary", href: "/sanctuary", shortcut: "3" },
    { label: "Projects", href: "/projects", shortcut: "4" },
  ],
  /** Off the dial: pages you reach through /go or the channel guide. */
  extras: [
    { label: "TV guide", href: "/guide", detail: "What's on every channel" },
    { label: "Arcade", href: "/play", detail: "Star Catcher, full screen" },
    { label: "Passport", href: "/passport", detail: "Your stickers for exploring" },
    {
      label: "Guestbook",
      href: "/guestbook",
      detail: "Sign the station's book",
    },
    {
      label: "Teletext",
      href: "/teletext",
      detail: "The plain facts, printable",
    },
    {
      label: "Test card",
      href: "/test-card",
      detail: "Channel 00: how this was built",
    },
  ],
  /**
   * Where the operator lives elsewhere. Empty `href`s are skipped, so fill
   * in the ones you use.
   */
  links: [
    { label: "GitHub", href: "https://github.com/putuhema" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/putuhema" },
    { label: "RSS", href: "/feed.xml" },
  ],
} as const;

/** The links that are actually filled in. */
export const profileLinks = siteConfig.links.filter(
  (link) => link.href.length > 0,
);

/**
 * The facts on file, for the teletext page and the dossier. Only what's
 * written here is ever shown or told to visitors; nothing is made up, so an
 * empty list simply doesn't appear.
 */
export const profile = {
  role: "Web developer",
  /** One or two plain sentences, as a recruiter would want them. */
  summary: "A web developer who loves to build stuff.",
  location: "Mamuju, Indonesia",
  /** e.g. { period: "2024 – now", title: "Frontend engineer", place: "Acme" } */
  experience: [
    { period: "2025 - now", title: "IT Supports", place: "RSUD Mamuju Tengah" },
  ] as { period: string; title: string; place: string }[],
  /** e.g. ["TypeScript", "React", "Next.js"] */
  skills: ["TypeScript", "React", "Next.js"] as string[],
};

/**
 * What the operator is up to right now: the /now panel. Keep it short and
 * date it, so visitors know how fresh it is.
 */
export const now = {
  updatedAt: "2026-10-06",
  items: [
    {
      label: "Building",
      value: "This station: Field Station P-4, a portfolio hosted by Mr. P",
    },
  ] as { label: string; value: string }[],
};
