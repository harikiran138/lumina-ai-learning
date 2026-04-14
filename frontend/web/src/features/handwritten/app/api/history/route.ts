import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const history = await prisma.analysisResult.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch history" },
            { status: 500 }
        );
    }
}
