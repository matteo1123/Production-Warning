import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new shared focus
export const createShare = mutation({
    args: {
        name: v.string(),
        links: v.array(
            v.object({
                key: v.string(),
                value: v.string(),
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
        sharedBy: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("shared_focuses", {
            name: args.name,
            links: args.links,
            warning: args.warning,
            contextNotes: args.contextNotes,
            createdAt: Date.now(),
            views: 0,
            sharedBy: args.sharedBy,
        });
        return id;
    },
});

// Get all shared focuses (most recent first)
export const listShares = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const shares = await ctx.db
            .query("shared_focuses")
            .order("desc")
            .take(limit);
        return shares;
    },
});

// Get a single shared focus by ID
export const getShare = query({
    args: {
        id: v.id("shared_focuses"),
    },
    handler: async (ctx, args) => {
        const share = await ctx.db.get(args.id);
        return share;
    },
});

// Increment view count
export const incrementViews = mutation({
    args: {
        id: v.id("shared_focuses"),
    },
    handler: async (ctx, args) => {
        const share = await ctx.db.get(args.id);
        if (share) {
            await ctx.db.patch(args.id, {
                views: share.views + 1,
            });
        }
    },
});
