import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkSession } from "./limits";

/** A tab that hasn't checked in for this long has tuned out. */
const stale = 90_000;

/**
 * Everyone tuned in: when they last checked in and which page they're on.
 * Queries can't watch the clock, so the client counts who's still recent.
 * Session ids stay private; pass yours to have your own row marked.
 */
export const list = query({
  args: { sessionId: v.optional(v.string()) },
  handler: async (ctx, { sessionId }) => {
    const tuned = await ctx.db
      .query("listeners")
      .withIndex("by_last_seen", (q) => q.gt("lastSeen", Date.now() - stale))
      .take(500);
    return tuned.map((listener) => ({
      id: listener._id,
      lastSeen: listener.lastSeen,
      path: listener.path ?? "/",
      mine: listener.sessionId === sessionId,
    }));
  },
});

/** Check in from any page, and sweep out a few long-gone tabs. */
export const heartbeat = mutation({
  args: { sessionId: v.string(), path: v.optional(v.string()) },
  handler: async (ctx, { sessionId, path: rawPath }) => {
    checkSession(sessionId);
    const now = Date.now();
    const path = rawPath?.slice(0, 120);
    const existing = await ctx.db
      .query("listeners")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { lastSeen: now, path });
    else await ctx.db.insert("listeners", { sessionId, lastSeen: now, path });

    const gone = await ctx.db
      .query("listeners")
      .withIndex("by_last_seen", (q) => q.lt("lastSeen", now - stale * 5))
      .take(20);
    await Promise.all(gone.map((row) => ctx.db.delete(row._id)));
  },
});
