import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { checkSession, clean } from "./limits";

export const maxName = 24;
export const maxBody = 140;
/** How many signatures the book shows. */
const pages = 200;

/** The book, newest signature first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const signatures = await ctx.db.query("signatures").order("desc").take(pages);
    return signatures.map(({ _id, _creationTime, sessionId, name, body }) => ({
      id: _id,
      at: _creationTime,
      sessionId,
      name,
      body,
    }));
  },
});

/** Sign the book: one line per visitor, so it stays a book and not a chat. */
export const sign = mutation({
  args: { sessionId: v.string(), name: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    checkSession(args.sessionId);
    const name = clean(args.name, maxName, "Sign with a name.");
    const body = clean(args.body, maxBody, "Leave a line first.");
    const signed = await ctx.db
      .query("signatures")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (signed) throw new ConvexError("You've signed already. It's a guestbook, not a diary.");
    await ctx.db.insert("signatures", { sessionId: args.sessionId, name, body });
  },
});

/** Moderation, from the dashboard or `npx convex run` only. */
export const remove = internalMutation({
  args: { id: v.id("signatures") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
