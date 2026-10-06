import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkSession } from "./limits";

/** A tab that hasn't checked in for this long has tuned out. */
const stale = 90_000;

/**
 * When everyone tuned in last checked in. Queries can't watch the clock, so
 * the client counts who's still recent.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const tuned = await ctx.db
      .query("listeners")
      .withIndex("by_last_seen", (q) => q.gt("lastSeen", Date.now() - stale))
      .take(500);
    return tuned.map((listener) => listener.lastSeen);
  },
});

/** Check in from any page, and sweep out a few long-gone tabs. */
export const heartbeat = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    checkSession(sessionId);
    const now = Date.now();
    const existing = await ctx.db
      .query("listeners")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { lastSeen: now });
    else await ctx.db.insert("listeners", { sessionId, lastSeen: now });

    const gone = await ctx.db
      .query("listeners")
      .withIndex("by_last_seen", (q) => q.lt("lastSeen", now - stale * 5))
      .take(20);
    await Promise.all(gone.map((row) => ctx.db.delete(row._id)));
  },
});
