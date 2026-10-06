import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { checkSession } from "./limits";

/** How many make the board. */
export const boardSize = 10;
/**
 * Scores come from the browser, so the board trusts them; this only keeps
 * out the obviously impossible. Ten points a star, a multiplier that grows
 * every five in a row: past this, someone's been editing the tape.
 */
const ceiling = 250_000;

/** The board, best first. */
export const top = query({
  args: {},
  handler: async (ctx) => {
    const best = await ctx.db.query("scores").withIndex("by_score").order("desc").take(boardSize);
    return best.map(({ _id, sessionId, initials, score }) => ({ id: _id, sessionId, initials, score }));
  },
});

/** Put a score up in lights, if it beats the board. Returns its place, 1-based. */
export const submit = mutation({
  args: { sessionId: v.string(), initials: v.string(), score: v.number() },
  handler: async (ctx, { sessionId, initials, score }) => {
    checkSession(sessionId);
    const tag = initials.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (tag.length === 0) throw new ConvexError("Initials, please. Up to three.");
    if (!Number.isInteger(score) || score <= 0 || score > ceiling) throw new ConvexError("That score won't fit on the board.");

    const last = await ctx.db
      .query("scores")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .first();
    if (last && Date.now() - last._creationTime < 15_000) throw new ConvexError("One at a time. Play another round first.");

    const board = await ctx.db.query("scores").withIndex("by_score").order("desc").take(boardSize);
    const place = board.filter((entry) => entry.score >= score).length + 1;
    if (place > boardSize) throw new ConvexError("Not quite enough for the board. So close.");

    await ctx.db.insert("scores", { sessionId, initials: tag, score });
    return place;
  },
});

/** Moderation, from the dashboard or `npx convex run` only. */
export const remove = internalMutation({
  args: { id: v.id("scores") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
