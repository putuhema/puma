import "server-only";

import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import type { Archive } from "@/lib/transmission";
import {
  contentSections,
  type ContentSection,
  isContentSection,
} from "@/lib/site";

const contentRoot = path.join(process.cwd(), "content");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

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
  externalUrl?: string;
  /** Projects: what the operator did on it. */
  role?: string;
  /** Projects: what it's built with. */
  stack: string[];
  /** Projects: where the source lives. */
  repoUrl?: string;
};

export type ContentEntry = EntryMetadata & {
  section: ContentSection;
  slug: string;
  href: string;
  headings: EntryHeading[];
  /** How long it takes to read, at a steady 220 words a minute. */
  readingMinutes: number;
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

function parseMetadata(data: Record<string, unknown>, filePath: string): EntryMetadata {
  assertString(data.title, "title", filePath);
  assertString(data.summary, "summary", filePath);
  assertDate(data.publishedAt, "publishedAt", filePath);

  if (data.updatedAt !== undefined) {
    assertDate(data.updatedAt, "updatedAt", filePath);
  }

  for (const field of ["tags", "stack"] as const) {
    const value = data[field];
    if (value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) {
      throw new Error(`${filePath}: frontmatter field "${field}" must be an array of strings.`);
    }
  }

  if (data.role !== undefined) assertString(data.role, "role", filePath);

  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    throw new Error(`${filePath}: frontmatter field "draft" must be a boolean.`);
  }

  for (const field of ["externalUrl", "repoUrl"] as const) {
    const value = data[field];
    if (value === undefined) continue;
    assertString(value, field, filePath);
    try {
      new URL(value);
    } catch {
      throw new Error(`${filePath}: frontmatter field "${field}" must be an absolute URL.`);
    }
  }

  return {
    title: data.title,
    summary: data.summary,
    publishedAt: data.publishedAt,
    updatedAt: data.updatedAt as string | undefined,
    tags: (data.tags as string[] | undefined) ?? [],
    draft: (data.draft as boolean | undefined) ?? false,
    externalUrl: data.externalUrl as string | undefined,
    role: data.role as string | undefined,
    stack: (data.stack as string[] | undefined) ?? [],
    repoUrl: data.repoUrl as string | undefined,
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
  const metadata = parseMetadata(data, filePath);

  return {
    ...metadata,
    section,
    slug,
    href: `/${section}/${slug}`,
    headings: extractHeadings(content),
    readingMinutes: Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 220)),
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

/** What Mr. P knows about: every published note and project, trimmed down. */
export function getArchive(): Archive {
  const trim = ({ href, slug, title, publishedAt, summary, stack }: ContentEntry) => ({
    href,
    slug,
    title,
    publishedAt,
    summary,
    stack,
  });
  return {
    notes: getEntries("notes").map(trim),
    projects: getEntries("projects").map(trim),
  };
}

export { formatEntryDate } from "@/lib/format";
