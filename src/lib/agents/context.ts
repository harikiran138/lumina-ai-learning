import { prisma } from '../prisma';

export class ContextManager {
    /**
     * Store a value in context memory
     */
    async set(key: string, value: unknown, options?: {
        agentId?: string;
        projectId?: string;
        type?: 'SHORT_TERM' | 'LONG_TERM' | 'SESSION';
        expiresIn?: number; // milliseconds
    }) {
        const expiresAt = options?.expiresIn
            ? new Date(Date.now() + options.expiresIn)
            : undefined;

        return prisma.contextMemory.create({
            data: {
                key,
                value: value as any,
                agentId: options?.agentId,
                projectId: options?.projectId,
                type: options?.type || 'SHORT_TERM',
                expiresAt,
            },
        });
    }

    /**
     * Get a value from context memory
     */
    async get(key: string, options?: {
        agentId?: string;
        projectId?: string;
    }) {
        const memory = await prisma.contextMemory.findFirst({
            where: {
                key,
                agentId: options?.agentId,
                projectId: options?.projectId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return memory?.value;
    }

    /**
     * Delete expired context memory
     */
    async cleanup() {
        await prisma.contextMemory.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }

    /**
     * Clear all context for an agent or project
     */
    async clear(options: {
        agentId?: string;
        projectId?: string;
    }) {
        await prisma.contextMemory.deleteMany({
            where: options,
        });
    }
}

export const contextManager = new ContextManager();
