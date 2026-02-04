import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit a new suggestion
export const submit = mutation({
    args: {
        type: v.string(),
        content: v.string(),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Validate type
        const validTypes = ["feature", "bug", "improvement", "other"];
        if (!validTypes.includes(args.type)) {
            throw new Error(`Invalid suggestion type. Must be one of: ${validTypes.join(", ")}`);
        }

        // Validate content length
        if (args.content.length < 10) {
            throw new Error("Suggestion must be at least 10 characters long");
        }
        if (args.content.length > 2000) {
            throw new Error("Suggestion must be less than 2000 characters");
        }

        // Insert the suggestion
        const suggestionId = await ctx.db.insert("suggestions", {
            type: args.type,
            content: args.content,
            email: args.email,
            status: "new",
            createdAt: Date.now(),
        });

        return { success: true, id: suggestionId };
    },
});

// Get all suggestions (for admin)
export const list = query({
    args: {
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.status) {
            const statusFilter = args.status;
            return await ctx.db
                .query("suggestions")
                .withIndex("by_status", (q) => q.eq("status", statusFilter))
                .order("desc")
                .collect();
        }
        return await ctx.db
            .query("suggestions")
            .withIndex("by_created")
            .order("desc")
            .collect();
    },
});

// Update suggestion status (for admin)
export const updateStatus = mutation({
    args: {
        id: v.id("suggestions"),
        status: v.string(),
        adminNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const validStatuses = ["new", "reviewed", "planned", "completed", "declined"];
        if (!validStatuses.includes(args.status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        }

        await ctx.db.patch(args.id, {
            status: args.status,
            adminNotes: args.adminNotes,
        });

        return { success: true };
    },
});
