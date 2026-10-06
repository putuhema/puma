import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /** The Sanctuary's chat: anyone can speak, under a name they pick. */
  messages: defineTable({
    sessionId: v.string(),
    name: v.string(),
    body: v.string(),
  }).index("by_session", ["sessionId"]),

  /** Who's in the room: each open tab checks in every few seconds. */
  presence: defineTable({
    sessionId: v.string(),
    name: v.string(),
    lastSeen: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_last_seen", ["lastSeen"]),

  /** Everyone tuned in to the station, on any channel: just a pulse. */
  listeners: defineTable({
    sessionId: v.string(),
    lastSeen: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_last_seen", ["lastSeen"]),

  /** Messages sent from the transmitter, for the operator's eyes only. */
  transmissions: defineTable({
    sessionId: v.string(),
    name: v.string(),
    /** Where to write back, if the sender left it. */
    replyTo: v.optional(v.string()),
    body: v.string(),
    /** Whether the operator was emailed about it. */
    relayed: v.boolean(),
  }).index("by_session", ["sessionId"]),

  /** The guestbook: one line per visitor, kept for good. */
  signatures: defineTable({
    sessionId: v.string(),
    name: v.string(),
    body: v.string(),
  }).index("by_session", ["sessionId"]),

  /** Star Catcher's high-score table: three arcade initials and a score. */
  scores: defineTable({
    sessionId: v.string(),
    initials: v.string(),
    score: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_session", ["sessionId"]),
});
