import type { MetadataRoute } from "next";
import { getEntries } from "@/lib/content";
import { contentSections, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = getEntries();
  const absolute = (pathname: string) => new URL(pathname, siteConfig.url).toString();

  return [
    {
      url: absolute("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...contentSections.map((section) => ({
      url: absolute(`/${section}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...entries.map((entry) => ({
      url: absolute(entry.href),
      lastModified: new Date(`${entry.updatedAt ?? entry.publishedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
