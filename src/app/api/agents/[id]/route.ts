import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/agents/[id] - Get agent details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const agent = await prisma.agent.findUnique({
            where: { id: params.id },
            include: {
                tasks: {
                    orderBy: { assignedAt: 'desc' },
                    take: 20,
                },
                _count: {
                    select: {
                        tasks: true,
                        chatLogs: true,
                    },
                },
            },
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ agent });
    } catch (error) {
        console.error('Get agent error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/agents/[id] - Update agent
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const agent = await prisma.agent.update({
            where: { id: params.id },
            data: body,
        });

        return NextResponse.json({
            message: 'Agent updated successfully',
            agent,
        });
    } catch (error) {
        console.error('Update agent error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.agent.delete({
            where: { id: params.id },
        });

        return NextResponse.json({
            message: 'Agent deleted successfully',
        });
    } catch (error) {
        console.error('Delete agent error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
