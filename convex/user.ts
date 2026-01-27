import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    if (!userId) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .first();

    return {
      name: identity.name ?? user?.name ?? null,
      email: identity.email ?? user?.email ?? null,
      image: identity.image ?? user?.image ?? null,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});
