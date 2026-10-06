import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const maxName = 24;
export const maxBody = 280;
/** How far back the room remembers. */
const history = 100;

/** The latest messages, oldest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db.query("messages").order("desc").take(history);
    return latest.reverse().map(({ _id, _creationTime, sessionId, name, body }) => ({
      id: _id,
      at: _creationTime,
      sessionId,
      name,
      body,
    }));
  },
});

/**
 * Say something in the room. Names and messages are trimmed and capped; a
 * visitor who talks too fast (a message a second, or five in 20 seconds) is
 * told to slow down.
 */
export const send = mutation({
  args: { sessionId: v.string(), name: v.string(), body: v.string() },
  handler: async (ctx, { sessionId, name, body }) => {
    const cleanName = name.trim().slice(0, maxName);
    const cleanBody = body.trim().slice(0, maxBody);
    if (!cleanName) throw new ConvexError("Pick a name first.");
    if (!cleanBody) throw new ConvexError("Say something first.");
    if (sessionId.length < 8 || sessionId.length > 64) throw new ConvexError("Bad session.");

    const now = Date.now();
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .take(5);
    if (recent[0] && now - recent[0]._creationTime < 1000) throw new ConvexError("Easy, one at a time.");
    if (recent.length === 5 && now - recent[4]._creationTime < 20_000) {
      throw new ConvexError("Slow down a little, the room needs a breather.");
    }

    await ctx.db.insert("messages", { sessionId, name: cleanName, body: cleanBody });
  },
});

/**
 * Moderation, from the dashboard or `npx convex run` only: take one message
 * down, or clear the room (up to 500 messages per run).
 */
export const remove = internalMutation({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    const batch = await ctx.db.query("messages").take(500);
    await Promise.all(batch.map((message) => ctx.db.delete(message._id)));
    return batch.length;
  },
});
