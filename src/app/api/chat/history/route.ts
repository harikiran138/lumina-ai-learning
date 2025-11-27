import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/chat/history - Get chat history
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const projectId = searchParams.get('projectId');
        const agentId = searchParams.get('agentId');
        const limit = parseInt(searchParams.get('limit') || '50');

        const chatLogs = await prisma.chatLog.findMany({
            where: {
                ...(projectId && { projectId }),
                ...(agentId && { agentId }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'asc',
            },
            take: limit,
        });

        return NextResponse.json({ chatLogs });
    } catch (error) {
        console.error('Get chat history error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
