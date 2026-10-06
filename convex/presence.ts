import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { maxName } from "./messages";

/** A tab that hasn't checked in for this long has left. */
const stale = 60_000;

/**
 * Everyone who checked in recently. Queries can't watch the clock, so this
 * returns last-seen times and the client decides who still counts.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - stale;
    const here = await ctx.db
      .query("presence")
      .withIndex("by_last_seen", (q) => q.gt("lastSeen", since))
      .take(200);
    return here.map(({ sessionId, name, lastSeen }) => ({ sessionId, name, lastSeen }));
  },
});

/** Check in (or update a name), and sweep out a few long-gone visitors. */
export const heartbeat = mutation({
  args: { sessionId: v.string(), name: v.string() },
  handler: async (ctx, { sessionId, name }) => {
    const now = Date.now();
    const cleanName = name.trim().slice(0, maxName) || "Earthling";
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { name: cleanName, lastSeen: now });
    else await ctx.db.insert("presence", { sessionId, name: cleanName, lastSeen: now });

    const gone = await ctx.db
      .query("presence")
      .withIndex("by_last_seen", (q) => q.lt("lastSeen", now - stale * 5))
      .take(20);
    await Promise.all(gone.map((row) => ctx.db.delete(row._id)));
  },
});

/** Leave the room right away (closing the tab). */
export const leave = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
