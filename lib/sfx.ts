import type { Emotion } from "@/lib/emotions";

/**
 * The station's sounds, synthesised on the fly so they belong to the same
 * machine: relay clicks, modem chirps, phosphor blips, and the VCR's clunk.
 * Browsers only start audio after a user gesture, so early calls are silent.
 */

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context.state === "running" ? context : null;
}

function whiteNoise(ctx: AudioContext) {
  if (noise) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noise;
}

/** A short shaped tone. */
function tone(
  ctx: AudioContext,
  {
    type = "square",
    from,
    to = from,
    start = 0,
    duration,
    gain = 0.05,
  }: { type?: OscillatorType; from: number; to?: number; start?: number; duration: number; gain?: number },
) {
  const at = ctx.currentTime + start;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, at);
  if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(envelope).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

/** A burst of filtered static. */
function hiss(
  ctx: AudioContext,
  {
    start = 0,
    duration,
    frequency,
    q = 1,
    gain = 0.08,
    type = "bandpass",
  }: { start?: number; duration: number; frequency: number; q?: number; gain?: number; type?: BiquadFilterType },
) {
  const at = ctx.currentTime + start;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  source.buffer = whiteNoise(ctx);
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter).connect(envelope).connect(ctx.destination);
  source.start(at, Math.random() * 0.3, duration + 0.02);
}

export const sfx = {
  /** A key on the console: a dry relay click. */
  key() {
    const ctx = audio();
    if (!ctx) return;
    hiss(ctx, { duration: 0.018, frequency: 3200, q: 4, gain: 0.12 });
    tone(ctx, { type: "triangle", from: 180, duration: 0.03, gain: 0.05 });
  },

  /** Sending a transmission: relay clunk, then a carrier tone dropping in. */
  send() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, { type: "sine", from: 140, to: 60, duration: 0.09, gain: 0.18 });
    hiss(ctx, { duration: 0.03, frequency: 2400, q: 3, gain: 0.1 });
    tone(ctx, { type: "sine", from: 1180, start: 0.06, duration: 0.12, gain: 0.025 });
  },

  /** Signal acquired: a short FSK modem chirp. */
  receive() {
    const ctx = audio();
    if (!ctx) return;
    [1200, 2200, 1200, 2200, 1800].forEach((frequency, index) => {
      tone(ctx, { type: "square", from: frequency, start: index * 0.035, duration: 0.03, gain: 0.018 });
    });
  },

  /** One phosphor blip as characters come in. */
  blip() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, { type: "square", from: 1400 + Math.random() * 500, duration: 0.012, gain: 0.008 });
  },

  /** Changing channel: the VCR mechanism clunks and the picture snows. */
  channel() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, { type: "sine", from: 90, to: 45, duration: 0.14, gain: 0.2 });
    hiss(ctx, { duration: 0.22, frequency: 1800, q: 0.4, gain: 0.05, type: "lowpass" });
    hiss(ctx, { start: 0.12, duration: 0.05, frequency: 3000, q: 3, gain: 0.08 });
  },

  /** Mr. P's voice: a little chirped phrase for each feeling. */
  emote(emotion: Emotion) {
    const ctx = audio();
    if (!ctx) return;
    // Each note: [frequency, start, duration]; sine for soft, square for buzzy.
    const phrases: Record<Emotion, { type: OscillatorType; notes: [number, number, number][] }> = {
      happy: { type: "sine", notes: [[880, 0, 0.08], [1175, 0.09, 0.1]] },
      excited: { type: "square", notes: [[988, 0, 0.06], [1319, 0.07, 0.06], [1568, 0.14, 0.06], [1976, 0.21, 0.1]] },
      love: { type: "sine", notes: [[784, 0, 0.14], [988, 0.15, 0.14], [1319, 0.3, 0.22]] },
      laugh: { type: "square", notes: [[1047, 0, 0.05], [1319, 0.07, 0.05], [1047, 0.14, 0.05], [1319, 0.21, 0.05], [1568, 0.28, 0.07]] },
      surprised: { type: "sine", notes: [[660, 0, 0.05], [1760, 0.05, 0.14]] },
      sad: { type: "sine", notes: [[659, 0, 0.2], [523, 0.2, 0.2], [392, 0.4, 0.35]] },
      thinking: { type: "triangle", notes: [[523, 0, 0.08], [587, 0.16, 0.08], [523, 0.32, 0.08]] },
      sleepy: { type: "sine", notes: [[392, 0, 0.3], [330, 0.32, 0.45]] },
      confused: { type: "triangle", notes: [[660, 0, 0.08], [554, 0.09, 0.08], [740, 0.2, 0.14]] },
      shy: { type: "sine", notes: [[1319, 0, 0.06], [1175, 0.08, 0.1]] },
      dizzy: { type: "triangle", notes: [[880, 0, 0.07], [698, 0.08, 0.07], [880, 0.16, 0.07], [698, 0.24, 0.07], [587, 0.32, 0.12]] },
      grumpy: { type: "sawtooth", notes: [[220, 0, 0.12], [185, 0.14, 0.18]] },
      wink: { type: "sine", notes: [[1568, 0, 0.05], [2093, 0.06, 0.08]] },
    };
    const phrase = phrases[emotion];
    phrase.notes.forEach(([frequency, start, duration]) => {
      tone(ctx, { type: phrase.type, from: frequency, to: frequency * 1.04, start, duration, gain: phrase.type === "sine" ? 0.05 : 0.022 });
    });
  },

  /** Nothing on that channel: a low buzz. */
  error() {
    const ctx = audio();
    if (!ctx) return;
    tone(ctx, { type: "sawtooth", from: 110, duration: 0.18, gain: 0.04 });
  },
};

export type Sfx = typeof sfx;
