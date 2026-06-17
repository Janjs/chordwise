import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createPendingRecording = mutation({
  args: {
    sessionId: v.string(),
    storageId: v.id("_storage"),
    prompt: v.optional(v.string()),
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const url = await ctx.storage.getUrl(args.storageId);

    if (!url) {
      throw new Error("Could not resolve uploaded recording.");
    }

    const id = await ctx.db.insert("pendingRecordings", {
      sessionId: args.sessionId,
      userId: userId ?? undefined,
      storageId: args.storageId,
      prompt: args.prompt,
      filename: args.filename,
      createdAt: Date.now(),
      consumed: false,
    });

    return {
      id,
      url,
      storageId: args.storageId,
    };
  },
});

export const getPendingRecordings = query({
  args: {
    ids: v.array(v.id("pendingRecordings")),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const id of args.ids) {
      const recording = await ctx.db.get(id);
      if (!recording || recording.consumed || recording.sessionId !== args.sessionId) {
        continue;
      }

      const url = await ctx.storage.getUrl(recording.storageId);
      if (!url) {
        continue;
      }

      results.push({
        id,
        url,
        storageId: recording.storageId,
        prompt: recording.prompt,
        filename: recording.filename,
      });
    }

    return results;
  },
});

export const consumePendingRecordings = mutation({
  args: {
    ids: v.array(v.id("pendingRecordings")),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const recording = await ctx.db.get(id);
      if (!recording || recording.sessionId !== args.sessionId) {
        continue;
      }

      await ctx.db.patch(id, { consumed: true });
    }
  },
});

export const getStorageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
