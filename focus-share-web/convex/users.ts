import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create a user by email
export const getOrCreateUser = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (existingUser) {
            return existingUser;
        }

        // Create new user with free tier
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            tier: "free",
            chatQueriesThisMonth: 0,
            chatQueriesResetAt: getNextMonthReset(),
            createdAt: now,
            updatedAt: now,
        });

        return await ctx.db.get(userId);
    },
});

// Get user by email
export const getUserByEmail = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

// Get user by Stripe customer ID
export const getUserByStripeCustomerId = query({
    args: {
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
            .unique();
    },
});

// Update user's subscription status (called by Stripe webhook)
export const updateSubscription = mutation({
    args: {
        email: v.string(),
        tier: v.string(),
        stripeCustomerId: v.optional(v.string()),
        stripeSubscriptionId: v.optional(v.string()),
        subscriptionStatus: v.optional(v.string()),
        subscriptionEndsAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            tier: args.tier,
            stripeCustomerId: args.stripeCustomerId,
            stripeSubscriptionId: args.stripeSubscriptionId,
            subscriptionStatus: args.subscriptionStatus,
            subscriptionEndsAt: args.subscriptionEndsAt,
            updatedAt: Date.now(),
        });

        return await ctx.db.get(user._id);
    },
});

// Get user's tier (for API calls)
export const getUserTier = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) {
            return { tier: "free", isPremium: false };
        }

        // Check if premium subscription is still active
        const isPremium = user.tier === "premium" &&
            (user.subscriptionStatus === "active" ||
                (user.subscriptionEndsAt && user.subscriptionEndsAt > Date.now()));

        return {
            tier: isPremium ? "premium" : "free",
            isPremium,
            subscriptionStatus: user.subscriptionStatus,
        };
    },
});

// Increment chat query count and check limits
export const incrementChatUsage = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) {
            // Guest user - allow but don't track
            return { allowed: true, remaining: null };
        }

        const now = Date.now();
        let queriesThisMonth = user.chatQueriesThisMonth || 0;
        let resetAt = user.chatQueriesResetAt || 0;

        // Reset counter if it's a new month
        if (now > resetAt) {
            queriesThisMonth = 0;
            resetAt = getNextMonthReset();
        }

        // Check limits based on tier
        const limits = {
            free: 20,      // 20 queries per month for free
            premium: 1000, // 1000 queries per month for premium
        };

        const limit = limits[user.tier as keyof typeof limits] || limits.free;

        if (queriesThisMonth >= limit) {
            return {
                allowed: false,
                remaining: 0,
                limit,
                message: user.tier === "free"
                    ? "You've reached your monthly limit. Upgrade to Premium for more queries!"
                    : "Monthly limit reached. Contact support if you need more.",
            };
        }

        // Increment counter
        await ctx.db.patch(user._id, {
            chatQueriesThisMonth: queriesThisMonth + 1,
            chatQueriesResetAt: resetAt,
            updatedAt: now,
        });

        return {
            allowed: true,
            remaining: limit - queriesThisMonth - 1,
            limit,
        };
    },
});

// Helper: Get timestamp for next month reset
function getNextMonthReset(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
}
