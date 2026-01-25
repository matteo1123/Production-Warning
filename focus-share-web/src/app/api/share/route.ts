import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, links, warning, contextNotes, sharedBy } = body;

        if (!name || !links || links.length === 0) {
            return NextResponse.json(
                { error: "Name and links are required" },
                { status: 400 }
            );
        }

        const id = await convex.mutation(api.shares.createShare, {
            name,
            links,
            warning: warning?.enabled ? warning : undefined,
            contextNotes: contextNotes?.length > 0 ? contextNotes : undefined,
            sharedBy,
        });

        return NextResponse.json({ id });
    } catch (error) {
        console.error("Share creation error:", error);
        return NextResponse.json(
            { error: "Failed to create share" },
            { status: 500 }
        );
    }
}
