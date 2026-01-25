import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    shared_focuses: defineTable({
        name: v.string(),
        links: v.array(
            v.object({
                key: v.string(),
                value: v.string(),
            })
        ),
        // Warning configuration (optional)
        warning: v.optional(
            v.object({
                enabled: v.boolean(),
                emblem: v.string(),
                urlRegex: v.string(),
                elementRegex: v.string(),
            })
        ),
        // Context notes (optional)
        contextNotes: v.optional(
            v.array(
                v.object({
                    urlPattern: v.string(),
                    note: v.string(),
                })
            )
        ),
        createdAt: v.number(),
        views: v.number(),
        sharedBy: v.optional(v.string()),
    }).index("by_created", ["createdAt"]),
});
