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
});
