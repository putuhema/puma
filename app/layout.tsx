import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
  Silkscreen,
  VT323,
} from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";
import { getArchive } from "@/lib/content";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-condensed",
  subsets: ["latin"],
  weight: ["700"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: "400",
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    url: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0C0B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn(
        "h-full scroll-smooth antialiased motion-reduce:scroll-auto",
        plexMono.variable,
        plexCondensed.variable,
        silkscreen.variable,
        vt323.variable,
      )}
    >
      <body className="flex min-h-full flex-col [-webkit-tap-highlight-color:transparent]">
        <SiteShell archive={getArchive()}>{children}</SiteShell>
      </body>
    </html>
  );
}
