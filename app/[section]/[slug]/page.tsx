import type { ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdxArticle } from "@/components/mdx-article";
import { getEntries, getEntry } from "@/lib/content";
import { siteConfig } from "@/lib/site";

type EntryPageProps = {
  params: Promise<{ section: string; slug: string }>;
};

type MdxModule = {
  default: ComponentType;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getEntries().map((entry) => ({
    section: entry.section,
    slug: entry.slug,
  }));
}

export async function generateMetadata({ params }: EntryPageProps): Promise<Metadata> {
  const { section, slug } = await params;
  const entry = getEntry(section, slug);
  if (!entry) return {};

  return {
    title: entry.title,
    description: entry.summary,
    alternates: { canonical: entry.href },
    openGraph: {
      title: `${entry.title} — ${siteConfig.name}`,
      description: entry.summary,
      type: "article",
      url: entry.href,
      publishedTime: entry.publishedAt,
      modifiedTime: entry.updatedAt,
      tags: entry.tags,
    },
  };
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { section, slug } = await params;
  const entry = getEntry(section, slug);
  if (!entry) notFound();

  let mdxModule: MdxModule;
  try {
    mdxModule = (await import(`@/content/${entry.section}/${entry.slug}.mdx`)) as MdxModule;
  } catch {
    notFound();
  }

  const Content = mdxModule.default;

  return (
    <MdxArticle entry={entry}>
      <Content />
    </MdxArticle>
  );
}
