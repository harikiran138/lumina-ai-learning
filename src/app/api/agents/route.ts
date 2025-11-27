import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orchestrator } from '@/lib/agents/orchestrator';
import { z } from 'zod';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
    try {
        const agents = await prisma.agent.findMany({
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json({ agents });
    } catch (error) {
        console.error('Get agents error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

const createAgentSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['RESEARCH', 'UI_UX', 'CODE', 'DATABASE', 'TEST', 'ORCHESTRATOR']),
    role: z.string().min(1),
    description: z.string().optional(),
    systemPrompt: z.string().optional(),
    tools: z.array(z.string()).optional(),
});

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createAgentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.errors },
                { status: 400 }
            );
        }

        const agent = await prisma.agent.create({
            data: {
                ...validation.data,
                status: 'IDLE',
            },
        });

        return NextResponse.json(
            { message: 'Agent created successfully', agent },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create agent error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
