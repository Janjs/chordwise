import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_userId_updatedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return chats;
  },
});

export const get = query({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const chat = await ctx.db.get(args.id);
    if (!chat || chat.userId !== userId) {
      return null;
    }

    return chat;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        parts: v.optional(v.any()),
        createdAt: v.number(),
      })
    ),
    progressions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const chatId = await ctx.db.insert("chats", {
      userId,
      title: args.title,
      messages: args.messages,
      progressions: args.progressions,
      createdAt: now,
      updatedAt: now,
    });

    return chatId;
  },
});

export const update = mutation({
  args: {
    id: v.id("chats"),
    title: v.optional(v.string()),
    messages: v.optional(
      v.array(
        v.object({
          id: v.string(),
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
          parts: v.optional(v.any()),
          createdAt: v.number(),
        })
      )
    ),
    progressions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.id);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.messages !== undefined) {
      updates.messages = args.messages;
    }
    if (args.progressions !== undefined) {
      updates.progressions = args.progressions;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.id);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
