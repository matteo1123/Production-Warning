import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Add an email to the signup list
 * Called from the waitlist page
 */
export const signup = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(args.email)) {
                return { success: false, error: "Invalid email address" };
            }

            // Normalize email to lowercase
            const normalizedEmail = args.email.toLowerCase().trim();

            // Check if email already exists
            const existing = await ctx.db
                .query("email_signups")
                .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
                .first();

            if (existing) {
                return { success: true, alreadySignedUp: true };
            }

            // Create the signup entry
            await ctx.db.insert("email_signups", {
                email: normalizedEmail,
                name: "",  // Empty string for name
                source: "extension_waitlist",
                notified: false,
            });

            return { success: true, alreadySignedUp: false };
        } catch (error) {
            console.error("Error in signup mutation:", error);
            throw error;
        }
    },
});

/**
 * Get all email signups (for admin use)
 */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const signups = await ctx.db
            .query("email_signups")
            .collect();

        return signups;
    },
});

/**
 * Mark emails as notified (for admin use)
 */
export const markNotified = mutation({
    args: {
        emails: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        for (const email of args.emails) {
            const signup = await ctx.db
                .query("email_signups")
                .withIndex("by_email", (q) => q.eq("email", email.toLowerCase().trim()))
                .first();

            if (signup) {
                await ctx.db.patch(signup._id, { notified: true });
            }
        }
        return { success: true };
    },
});
