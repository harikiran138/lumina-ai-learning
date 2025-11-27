import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orchestrator } from '@/lib/agents/orchestrator';
import { z } from 'zod';

const assignTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    priority: z.number().int().min(1).max(10).optional(),
    input: z.record(z.unknown()).optional(),
    projectId: z.string().optional(),
});

// POST /api/agents/[id]/assign - Assign a task to an agent
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const agentId = params.id;

        // Verify agent exists
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const validation = assignTaskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.errors },
                { status: 400 }
            );
        }

        // Create task using orchestrator
        const taskId = await orchestrator.createTask({
            ...validation.data,
            agentType: agent.type,
        });

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { agent: true },
        });

        return NextResponse.json(
            { message: 'Task assigned successfully', task },
            { status: 201 }
        );
    } catch (error) {
        console.error('Assign task error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
