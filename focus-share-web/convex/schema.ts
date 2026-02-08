import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users table for subscription management
    users: defineTable({
        email: v.string(),
        name: v.optional(v.string()),
        // Subscription tier: "free" or "premium"
        tier: v.string(),
        // Stripe customer ID for payment management
        stripeCustomerId: v.optional(v.string()),
        // Stripe subscription ID
        stripeSubscriptionId: v.optional(v.string()),
        // Subscription status: "active", "canceled", "past_due", etc.
        subscriptionStatus: v.optional(v.string()),
        // When subscription ends (for canceled subscriptions)
        subscriptionEndsAt: v.optional(v.number()),
        // Chat usage tracking
        chatQueriesThisMonth: v.optional(v.number()),
        chatQueriesResetAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_email", ["email"])
        .index("by_stripeCustomerId", ["stripeCustomerId"]),

    shared_focuses: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        links: v.array(
            v.object({
                key: v.string(),
                value: v.string(),
                context: v.optional(v.string()),
                warning: v.optional(
                    v.object({
                        enabled: v.boolean(),
                        emblem: v.string(),
                        elementRegex: v.string(),
                    })
                ),
            })
        ),
        warning: v.optional(
            v.object({
                enabled: v.boolean(),
                emblem: v.string(),
                urlRegex: v.string(),
                elementRegex: v.string(),
            })
        ),
        contextNotes: v.optional(
            v.array(
                v.object({
                    urlPattern: v.string(),
                    note: v.string(),
                })
            )
        ),
        // Visibility: "public" or "private"
        visibility: v.optional(v.string()),
        // Owner user ID for private shares
        ownerId: v.optional(v.id("users")),
        createdAt: v.number(),
        views: v.number(),
        sharedBy: v.optional(v.string()),
        // Secret token for updating the share (anonymous ownership)
        updateToken: v.optional(v.string()),
    })
        .index("by_created", ["createdAt"])
        .index("by_owner", ["ownerId"]),

    // Chat messages for logging/troubleshooting
    chat_messages: defineTable({
        // What the user asked
        userMessage: v.string(),
        // Content extracted from tabs (can be large)
        contentSent: v.string(),
        // Model's response
        modelResponse: v.string(),
        // Focus name for context
        focusName: v.optional(v.string()),
        // User email if available
        userEmail: v.optional(v.string()),
        // Model used
        model: v.optional(v.string()),
        // Timestamps
        createdAt: v.number(),
    })
        .index("by_created", ["createdAt"])
        .index("by_user", ["userEmail"]),

    // User suggestions/feedback
    suggestions: defineTable({
        // Type of suggestion: "feature", "bug", "improvement", "other"
        type: v.string(),
        // The suggestion content
        content: v.string(),
        // Optional email for follow-up
        email: v.optional(v.string()),
        // Status: "new", "reviewed", "planned", "completed", "declined"
        status: v.string(),
        // Admin notes (internal)
        adminNotes: v.optional(v.string()),
        // Timestamps
        createdAt: v.number(),
    })
        .index("by_created", ["createdAt"])
        .index("by_status", ["status"]),

    // Email signup list for extension release notifications
    email_signups: defineTable({
        // Email address
        email: v.string(),
        // Name 
        name: v.string(),
        // Source where they signed up (e.g., "extension_waitlist")
        source: v.optional(v.string()),
        // Whether they've been notified
        notified: v.optional(v.boolean()),
    })
        .index("by_email", ["email"]),
});
