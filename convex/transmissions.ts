import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, mutation } from "./_generated/server";
import { checkSession } from "./limits";

const maxName = 60;
const maxReplyTo = 120;
const maxBody = 2000;

/**
 * Send a message to the operator. It's filed here, then relayed by email
 * when the deployment has RESEND_API_KEY and CONTACT_EMAIL set. Three
 * messages an hour per visitor is plenty for anyone with something to say.
 */
export const send = mutation({
  args: { sessionId: v.string(), name: v.string(), replyTo: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    checkSession(args.sessionId);
    const name = args.name.trim().slice(0, maxName) || "Anonymous";
    const replyTo = args.replyTo.trim().slice(0, maxReplyTo) || undefined;
    const body = args.body.trim().slice(0, maxBody);
    if (!body) throw new ConvexError("Write something first.");
    if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      throw new ConvexError("That reply address doesn't look like an email.");
    }

    const recent = await ctx.db
      .query("transmissions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(3);
    if (recent.length === 3 && Date.now() - recent[2]._creationTime < 60 * 60_000) {
      throw new ConvexError("That's three this hour. The operator reads slower than you write.");
    }

    const id = await ctx.db.insert("transmissions", {
      sessionId: args.sessionId,
      name,
      replyTo,
      body,
      relayed: false,
    });
    await ctx.scheduler.runAfter(0, internal.transmissions.relay, { id, name, replyTo, body });
  },
});

/** Emails the operator a copy through Resend, if it's set up. */
export const relay = internalAction({
  args: { id: v.id("transmissions"), name: v.string(), replyTo: v.optional(v.string()), body: v.string() },
  handler: async (ctx, { id, name, replyTo, body }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_EMAIL;
    if (!apiKey || !to) return;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM ?? "Field Station P-4 <onboarding@resend.dev>",
        to: [to],
        reply_to: replyTo,
        subject: `Transmission from ${name}`,
        text: `${body}\n\n— ${name}${replyTo ? ` <${replyTo}>` : " (no reply address)"}`,
      }),
    });
    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
    await ctx.runMutation(internal.transmissions.markRelayed, { id });
  },
});

export const markRelayed = internalMutation({
  args: { id: v.id("transmissions") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { relayed: true });
  },
});

/** Housekeeping, from the dashboard or `npx convex run` only. */
export const remove = internalMutation({
  args: { id: v.id("transmissions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
