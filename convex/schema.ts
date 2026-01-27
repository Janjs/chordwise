import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  userCredits: defineTable({
    userId: v.string(),
    credits: v.number(),
  }).index("by_userId", ["userId"]),
  anonymousUsers: defineTable({
    sessionId: v.string(),
    creditsUsed: v.number(),
  }).index("by_sessionId", ["sessionId"]),
  promptCache: defineTable({
    cacheKey: v.string(),
    response: v.string(),
    headers: v.any(),
    timestamp: v.number(),
  }).index("by_cacheKey", ["cacheKey"]),
  toolCache: defineTable({
    cacheKey: v.string(),
    result: v.any(),
    timestamp: v.number(),
  }).index("by_cacheKey", ["cacheKey"]),
});
