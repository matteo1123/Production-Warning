import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new shared focus
export const createShare = mutation({
    args: {
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
        sharedBy: v.optional(v.string()),
        // New: visibility and owner for private sharing
        visibility: v.optional(v.string()),
        ownerEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // If private, look up owner ID
        let ownerId = undefined;
        if (args.visibility === "private" && args.ownerEmail) {
            const owner = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", args.ownerEmail!))
                .unique();
            if (owner) {
                ownerId = owner._id;
            }
        }

        // Generate a random update token for anonymous ownership
        // Using built-in crypto since we can't easily import uuid here without deps
        const updateToken = crypto.randomUUID();

        const id = await ctx.db.insert("shared_focuses", {
            name: args.name,
            description: args.description,
            links: args.links,
            warning: args.warning,
            contextNotes: args.contextNotes,
            visibility: args.visibility || "public",
            ownerId: ownerId,
            createdAt: Date.now(),
            views: 0,
            sharedBy: args.sharedBy,
            updateToken: updateToken,
        });

        // Return both ID and token so the creator can save it
        return { id, updateToken };
    },
});

// Update an existing shared focus
export const updateShare = mutation({
    args: {
        id: v.id("shared_focuses"),
        updateToken: v.string(),
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
    },
    handler: async (ctx, args) => {
        const share = await ctx.db.get(args.id);

        if (!share) {
            throw new Error("Focus not found");
        }

        // Verify token matches
        if (share.updateToken !== args.updateToken) {
            throw new Error("Invalid update token");
        }

        await ctx.db.patch(args.id, {
            name: args.name,
            description: args.description,
            links: args.links,
            warning: args.warning,
            contextNotes: args.contextNotes,
        });

        return { success: true };
    },
});

// Get all shared focuses (most recent first) - only public ones
export const listShares = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const allShares = await ctx.db
            .query("shared_focuses")
            .order("desc")
            .take(limit * 2); // Fetch more to filter

        // Filter to only public shares and remove updateToken
        const publicShares = allShares
            .filter(share => !share.visibility || share.visibility === "public")
            .slice(0, limit)
            .map(share => {
                // Remove sensitive token
                const { updateToken, ...publicData } = share;
                return publicData;
            });

        return publicShares;
    },
});

// Get user's own shares (including private)
export const listMyShares = query({
    args: {
        email: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Find user
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) {
            return [];
        }

        const limit = args.limit ?? 50;
        const shares = await ctx.db
            .query("shared_focuses")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .order("desc")
            .take(limit);

        // Even for own shares, we might want to redact token unless actively editing, 
        // but for now let's redact it to be safe.
        return shares.map(share => {
            const { updateToken, ...data } = share;
            return data;
        });
    },
});

// Get a single shared focus by ID
export const getShare = query({
    args: {
        id: v.id("shared_focuses"),
        viewerEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const share = await ctx.db.get(args.id);

        if (!share) {
            return null;
        }

        // Always remove updateToken from public query
        const { updateToken, ...safeShare } = share;

        // If private, check if viewer is owner
        if (share.visibility === "private") {
            if (!args.viewerEmail) {
                // No viewer email provided - return limited info
                return {
                    ...safeShare,
                    isPrivate: true,
                    accessDenied: true,
                };
            }

            const viewer = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", args.viewerEmail!))
                .unique();

            if (!viewer || !share.ownerId || viewer._id !== share.ownerId) {
                return {
                    ...safeShare,
                    isPrivate: true,
                    accessDenied: true,
                };
            }
        }

        return { ...safeShare, isPrivate: share.visibility === "private", accessDenied: false };
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
