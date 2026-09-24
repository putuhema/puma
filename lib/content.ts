import "server-only";

import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import {
  contentSections,
  type ContentSection,
  isContentSection,
} from "@/lib/site";

const contentRoot = path.join(process.cwd(), "content");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type ReadingStatus = "reading" | "finished" | "queued";

export type EntryHeading = {
  depth: 2 | 3;
  id: string;
  title: string;
};

export type EntryMetadata = {
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  draft: boolean;
  author?: string;
  bookYear?: number;
  readingStatus?: ReadingStatus;
  externalUrl?: string;
};

export type ContentEntry = EntryMetadata & {
  section: ContentSection;
  slug: string;
  href: string;
  headings: EntryHeading[];
};

function assertString(
  value: unknown,
  field: string,
  filePath: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${filePath}: frontmatter field "${field}" must be a non-empty string.`);
  }
}

function assertDate(
  value: unknown,
  field: string,
  filePath: string,
): asserts value is string {
  assertString(value, field, filePath);
  if (!datePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${filePath}: frontmatter field "${field}" must use YYYY-MM-DD.`);
  }
}

function parseMetadata(
  data: Record<string, unknown>,
  section: ContentSection,
  filePath: string,
): EntryMetadata {
  assertString(data.title, "title", filePath);
  assertString(data.summary, "summary", filePath);
  assertDate(data.publishedAt, "publishedAt", filePath);

  if (data.updatedAt !== undefined) {
    assertDate(data.updatedAt, "updatedAt", filePath);
  }

  if (
    data.tags !== undefined &&
    (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string"))
  ) {
    throw new Error(`${filePath}: frontmatter field "tags" must be an array of strings.`);
  }

  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    throw new Error(`${filePath}: frontmatter field "draft" must be a boolean.`);
  }

  if (data.externalUrl !== undefined) {
    assertString(data.externalUrl, "externalUrl", filePath);
    try {
      new URL(data.externalUrl);
    } catch {
      throw new Error(`${filePath}: frontmatter field "externalUrl" must be an absolute URL.`);
    }
  }

  if (section === "books") {
    assertString(data.author, "author", filePath);
    if (!Number.isInteger(data.bookYear)) {
      throw new Error(`${filePath}: frontmatter field "bookYear" must be an integer.`);
    }
    if (!(["reading", "finished", "queued"] as const).includes(data.readingStatus as ReadingStatus)) {
      throw new Error(
        `${filePath}: frontmatter field "readingStatus" must be reading, finished, or queued.`,
      );
    }
  }

  return {
    title: data.title,
    summary: data.summary,
    publishedAt: data.publishedAt,
    updatedAt: data.updatedAt as string | undefined,
    tags: (data.tags as string[] | undefined) ?? [],
    draft: (data.draft as boolean | undefined) ?? false,
    author: data.author as string | undefined,
    bookYear: data.bookYear as number | undefined,
    readingStatus: data.readingStatus as ReadingStatus | undefined,
    externalUrl: data.externalUrl as string | undefined,
  };
}

function plainHeading(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+#+\s*$/, "")
    .trim();
}

function extractHeadings(source: string): EntryHeading[] {
  const slugger = new GithubSlugger();

  return source
    .split("\n")
    .flatMap((line): EntryHeading[] => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line);
      if (!match) return [];
      const title = plainHeading(match[2]);
      return [
        {
          depth: match[1].length as 2 | 3,
          id: slugger.slug(title),
          title,
        },
      ];
    });
}

function readEntry(section: ContentSection, slug: string): ContentEntry | null {
  if (!slugPattern.test(slug)) return null;

  const filePath = path.join(contentRoot, section, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);
  const metadata = parseMetadata(data, section, filePath);

  return {
    ...metadata,
    section,
    slug,
    href: `/${section}/${slug}`,
    headings: extractHeadings(content),
  };
}

export function getEntry(section: string, slug: string): ContentEntry | null {
  if (!isContentSection(section)) return null;
  const entry = readEntry(section, slug);
  if (!entry || (entry.draft && process.env.NODE_ENV === "production")) return null;
  return entry;
}

export function getEntries(section?: ContentSection): ContentEntry[] {
  const sections = section ? [section] : contentSections;

  return sections
    .flatMap((currentSection) => {
      const directory = path.join(contentRoot, currentSection);
      if (!fs.existsSync(directory)) return [];

      return fs
        .readdirSync(directory)
        .filter((fileName) => fileName.endsWith(".mdx"))
        .map((fileName) => readEntry(currentSection, fileName.replace(/\.mdx$/, "")))
        .filter((entry): entry is ContentEntry => entry !== null);
    })
    .filter((entry) => process.env.NODE_ENV !== "production" || !entry.draft)
    .sort((a, b) => {
      const aDate = a.updatedAt ?? a.publishedAt;
      const bDate = b.updatedAt ?? b.publishedAt;
      return bDate.localeCompare(aDate);
    });
}

export function formatEntryDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}
