import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, links, warning, contextNotes, sharedBy, id, updateToken } = body;

        if (!name || !links || links.length === 0) {
            return NextResponse.json(
                { error: "Name and links are required" },
                { status: 400 }
            );
        }

        // If ID and Token are present, try to update
        if (id && updateToken) {
            try {
                await convex.mutation(api.shares.updateShare, {
                    id,
                    updateToken,
                    name,
                    links,
                    warning: warning?.enabled ? warning : undefined,
                    contextNotes: contextNotes?.length > 0 ? contextNotes : undefined,
                });
                return NextResponse.json({ success: true, id, updateToken });
            } catch (error) {
                console.error("Update failed:", error);
                // Fall back to create if update fails (e.g. invalid token)
                // OR return error? Let's return error to let client know
                return NextResponse.json(
                    { error: "Failed to update share. Invalid token?" },
                    { status: 403 }
                );
            }
        }

        // Otherwise create new
        const result = await convex.mutation(api.shares.createShare, {
            name,
            links,
            warning: warning?.enabled ? warning : undefined,
            contextNotes: contextNotes?.length > 0 ? contextNotes : undefined,
            sharedBy,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Share creation error:", error);
        return NextResponse.json(
            { error: "Failed to create share" },
            { status: 500 }
        );
    }
}
