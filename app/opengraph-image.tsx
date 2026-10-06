import { ogSize, stationCard } from "@/lib/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name}: a portfolio that plays like a tape on a CRT, hosted by Mr. P`;
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  return stationCard({
    kicker: "Channel 01 · now playing",
    title: siteConfig.fullname,
    summary: `${siteConfig.description} Ask Mr. P, the station's host, anything.`,
  });
}
