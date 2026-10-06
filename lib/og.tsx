import "server-only";

import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };

/**
 * Fetches a Google font as TrueType, subset to `text`. The build already
 * needs the network for next/font; if it isn't there, the card falls back
 * to the default face instead of failing.
 */
async function googleFont(family: string, text: string) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = /src: url\((.+?)\) format\('(opentype|truetype)'\)/.exec(css)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

const palette = {
  glass: "#050605",
  phosphor: "#e9e9e2",
  dim: "#9aa59c",
  osd: "#2337f0",
  signal: "#ff7a2e",
  stamp: "#ff4b3e",
};

/**
 * A share card that looks like a still from the station: a frame of black
 * CRT glass with scanlines, the VHS menu bar, and the title in phosphor.
 */
export async function stationCard({ kicker, title, summary }: { kicker: string; title: string; summary?: string }) {
  const text = `${kicker}${title}${summary ?? ""}${siteConfig.name}PLAYREC ▶●·0123456789:`;
  const vt323 = await googleFont("VT323", text);
  const silkscreen = await googleFont("Silkscreen", text.toUpperCase());

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000", padding: 28 }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            borderRadius: 48,
            overflow: "hidden",
            background: palette.glass,
            color: palette.phosphor,
            padding: "44px 60px",
            fontFamily: vt323 ? "VT323" : undefined,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, color: palette.dim }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, color: palette.stamp }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: palette.stamp }} />
              REC
            </div>
            <div style={{ display: "flex" }}>▶ PLAY</div>
          </div>

          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 40,
              padding: "4px 14px",
              background: palette.osd,
              color: "#f4f6ff",
              fontSize: 28,
              fontFamily: silkscreen ? "Silkscreen" : undefined,
            }}
          >
            {kicker.toUpperCase()}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: title.length > 40 ? 76 : 100,
              lineHeight: 0.95,
              textTransform: "uppercase",
              textShadow: `-3px 0 0 rgba(255,40,80,0.45), 3px 0 0 rgba(40,140,255,0.45), 0 0 28px rgba(227,236,228,0.35)`,
            }}
          >
            {title}
          </div>

          {summary && (
            <div style={{ display: "flex", marginTop: 26, fontSize: 38, lineHeight: 1.15, color: palette.dim, maxWidth: 960 }}>
              {summary.length > 140 ? `${summary.slice(0, 137)}…` : summary}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "auto",
              fontSize: 34,
              color: palette.signal,
            }}
          >
            <div style={{ display: "flex" }}>{siteConfig.name.toUpperCase()} · FIELD STATION P-4</div>
            <div style={{ display: "flex" }}>{new URL(siteConfig.url).host}</div>
          </div>

          {/* Scanlines over everything. */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        ...(vt323 ? [{ name: "VT323", data: vt323, style: "normal" as const, weight: 400 as const }] : []),
        ...(silkscreen ? [{ name: "Silkscreen", data: silkscreen, style: "normal" as const, weight: 400 as const }] : []),
      ],
    },
  );
}
