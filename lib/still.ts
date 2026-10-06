import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signs Mr. P's lines so a shared still can only ever quote something he
 * actually said: the chat route signs each reply, the still checks it.
 */
function secret() {
  return process.env.STILL_SECRET ?? process.env.ZAI_API_KEY ?? null;
}

export function signLine(text: string) {
  const key = secret();
  return key ? createHmac("sha256", key).update(text).digest("base64url").slice(0, 32) : undefined;
}

export function verifyLine(text: string, signature: string) {
  const expected = signLine(text);
  if (!expected || expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Longest line a still will quote. */
export const maxStillLength = 600;
