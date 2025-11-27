import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/db/test - Test database connectivity
export async function GET(request: NextRequest) {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        // Get database stats
        const [userCount, agentCount, taskCount, chatLogCount] = await Promise.all([
            prisma.user.count(),
            prisma.agent.count(),
            prisma.task.count(),
            prisma.chatLog.count(),
        ]);

        return NextResponse.json({
            status: 'connected',
            message: 'Database connection successful',
            stats: {
                users: userCount,
                agents: agentCount,
                tasks: taskCount,
                chatLogs: chatLogCount,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Database test error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Database connection failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
