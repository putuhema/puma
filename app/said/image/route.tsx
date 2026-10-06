import { quoteCard } from "@/lib/og";
import { maxStillLength, verifyLine } from "@/lib/still";

/** The still for a shared line, if the signature checks out. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const line = (params.get("l") ?? "").slice(0, maxStillLength);
  const signature = params.get("s") ?? "";
  if (!line || !verifyLine(line, signature)) return new Response("No signal", { status: 404 });
  const card = await quoteCard(line);
  card.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return card;
}
