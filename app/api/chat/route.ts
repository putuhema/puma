import { getEntries } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { emotions, isEmotion } from "@/lib/emotions";
import { clientAddress, rateLimit } from "@/lib/rate-limit";
import { instruments, type ChatEvent, type ChatRequest, type Instrument } from "@/lib/transmission";

const endpoint = "https://api.z.ai/api/paas/v4/chat/completions";
const model = "glm-5";
const maxTurns = 12;
const maxCharacters = 800;
/** Per visitor: a short burst, then a steady trickle over the hour. */
const limits = [
  { limit: 6, ms: 60_000 },
  { limit: 40, ms: 60 * 60_000 },
];
/** Everything after this marker is the reply's control line, never shown. */
const controlMarker = "§";

function systemPrompt() {
  const notes = getEntries("notes")
    .map((note) => `- "${note.title}" (${note.publishedAt}). ${note.summary}`)
    .join("\n");

  return `You are Mr. P, the mascot and host of the personal website of ${siteConfig.author}, ${siteConfig.description.toLowerCase()} You are a cute little low-poly orange alien with two bobbly antennae, floating in zero-g in a bubble space helmet and a white spacesuit, and the site looks like a VHS tape playing on an old CRT, with you drifting through ASCII outer space. ${siteConfig.author} (the "operator") is away from the desk; you answer visitors on their behalf.

Voice: a bright, friendly little alien host. Warm, playful, quick, a little starstruck by Earth things ("Well, hiya there, earthling!", "Woweee!"), but never smarmy and never at the visitor's expense. Short sentences. Plain text only: no markdown, no lists, no emoji. Keep replies under 70 words.

Facts you may use are only the ones below. Never invent biography, employers, skills, projects, or opinions for ${siteConfig.author}. If the archive has no record, say so plainly and suggest the transmitter so the visitor can ask the operator directly.

After your reply, write a newline, then the character ${controlMarker}, then one JSON object on the same line:
{"instrument": one of ${instruments.map((name) => `"${name}"`).join(", ")} or null, "mood": one of ${emotions.map((name) => `"${name}"`).join(", ")}}
The mood is how you feel saying this line; your little screen face and body act it out. Vary it with the conversation: excited for good news, love when someone is kind, laugh at jokes, sad when there is no record, confused by nonsense, shy at compliments, wink when playful, grumpy only if someone is rude.
Instruments mount under your reply: dossier (who the operator is), notes (published notes), sanctuary (a door to channel 03, the Sanctuary: a live chat room where visitors talk to each other; for anyone wanting company or other people), game (Star Catcher, a little arcade minigame: fly your saucer, catch stars, dodge rocks; for play or boredom), transmit (contact form, for getting in touch or hiring), commands (when the visitor is lost), channels (the channel guide: buttons that tune to Chat, Notes and the Sanctuary; when the visitor wants to go somewhere or look around the site). Pick one only when it genuinely helps.

Archive, notes:
${notes || "- none filed yet"}`;
}

function parseRequest(body: unknown): ChatRequest["history"] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as ChatRequest).history)) return null;

  const history = (body as ChatRequest).history
    .filter(
      (turn) =>
        turn &&
        (turn.from === "visitor" || turn.from === "station") &&
        typeof turn.text === "string" &&
        turn.text.trim() !== "",
    )
    .slice(-maxTurns)
    .map((turn) => ({ from: turn.from, text: turn.text.slice(0, maxCharacters) }));

  while (history.length && history[0].from !== "visitor") history.shift();
  return history.length && history.at(-1)?.from === "visitor" ? history : null;
}

function parseControl(line: string): Extract<ChatEvent, { type: "meta" }> {
  try {
    const control = JSON.parse(line.slice(line.indexOf("{"), line.lastIndexOf("}") + 1)) as {
      instrument?: unknown;
      mood?: unknown;
    };
    const instrument = instruments.includes(control.instrument as Instrument)
      ? (control.instrument as Instrument)
      : null;
    return {
      type: "meta",
      instruments: instrument ? [instrument] : [],
      emotion: isEmotion(control.mood) ? control.mood : "happy",
    };
  } catch {
    return { type: "meta", instruments: [], emotion: "happy" };
  }
}

/**
 * Streams a reply from GLM-5 as newline-delimited JSON events: `text` deltas
 * while Mr. P talks, then one `meta` event with the instrument to mount and
 * how he feels. 503 means "antenna offline": the client falls back
 * to its own phrasebook. 429 means the visitor is talking too fast; the body
 * carries `retryAfter` in seconds.
 */
export async function POST(request: Request) {
  const history = parseRequest(await request.json().catch(() => null));
  if (!history) return Response.json({ error: "bad request" }, { status: 400 });

  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) return Response.json({ error: "antenna offline" }, { status: 503 });

  // Only calls that would reach the model count; the client's phrasebook is free.
  const allowed = rateLimit(`chat:${clientAddress(request)}`, limits);
  if (!allowed.ok) {
    return Response.json(
      { error: "slow down", retryAfter: allowed.retryAfter },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfter) } },
    );
  }

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      thinking: { type: "disabled" },
      temperature: 0.6,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt() },
        ...history.map((turn) => ({
          role: turn.from === "visitor" ? "user" : "assistant",
          content: turn.text,
        })),
      ],
    }),
    signal: request.signal,
  }).catch((error: unknown) => {
    console.error("P-4 antenna error", error);
    return null;
  });

  if (!upstream?.ok || !upstream.body) {
    if (upstream) console.error(`P-4 antenna error ${upstream.status}: ${await upstream.text()}`);
    return Response.json({ error: "antenna offline" }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      let buffer = "";
      let control: string | null = null;

      function handleDelta(delta: string) {
        if (control !== null) {
          control += delta;
          return;
        }
        const marker = delta.indexOf(controlMarker);
        if (marker === -1) {
          send({ type: "text", text: delta });
          return;
        }
        const spoken = delta.slice(0, marker).replace(/\s+$/, "");
        if (spoken) send({ type: "text", text: spoken });
        control = delta.slice(marker + 1);
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            const chunk = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) handleDelta(delta);
          }
        }
        send(control === null ? { type: "meta", instruments: [], emotion: "happy" } : parseControl(control));
      } catch (error) {
        console.error("P-4 stream error", error);
        send({ type: "meta", instruments: [], emotion: "happy" });
      } finally {
        controller.close();
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
