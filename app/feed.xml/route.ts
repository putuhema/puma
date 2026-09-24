import { getEntries } from "@/lib/content";
import { sectionDetails, siteConfig } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export function GET() {
  const entries = getEntries();
  const feedUrl = new URL("/feed.xml", siteConfig.url).toString();
  const items = entries
    .map((entry) => {
      const url = new URL(entry.href, siteConfig.url).toString();
      return `
        <item>
          <title>${escapeXml(entry.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="true">${escapeXml(url)}</guid>
          <pubDate>${new Date(`${entry.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
          <category>${escapeXml(sectionDetails[entry.section].title)}</category>
          <description>${escapeXml(entry.summary)}</description>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>${escapeXml(siteConfig.name)}</title>
        <link>${escapeXml(siteConfig.url)}</link>
        <description>${escapeXml(siteConfig.description)}</description>
        <language>en</language>
        <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
