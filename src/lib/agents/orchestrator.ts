import { prisma } from '../prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

export interface AgentConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface TaskInput {
    title: string;
    description: string;
    agentType: string;
    projectId?: string;
    priority?: number;
    input?: Record<string, unknown>;
}

export interface TaskResult {
    success: boolean;
    data?: unknown;
    error?: string;
    reasoning?: unknown[];
}

/**
 * Agent Orchestrator - Coordinates all agents and tasks
 */
export class AgentOrchestrator {
    private activeAgents: Map<string, boolean> = new Map();
    private taskQueue: string[] = [];

    /**
     * Create a new task and assign it to an agent
     */
    async createTask(taskInput: TaskInput): Promise<string> {
        // Find an available agent of the specified type
        const agent = await prisma.agent.findFirst({
            where: {
                type: taskInput.agentType as any,
                status: 'IDLE',
            },
        });

        if (!agent) {
            throw new Error(`No available agent of type ${taskInput.agentType}`);
        }

        // Create the task
        const task = await prisma.task.create({
            data: {
                title: taskInput.title,
                description: taskInput.description,
                agentId: agent.id,
                projectId: taskInput.projectId,
                priority: taskInput.priority || 5,
                input: (taskInput.input || {}) as any,
                status: 'PENDING',
            },
        });

        // Add to queue
        this.taskQueue.push(task.id);

        // Start processing if not already active
        if (!this.activeAgents.get(agent.id)) {
            this.processTask(task.id).catch(console.error);
        }

        return task.id;
    }

    /**
     * Process a task using the assigned agent
     */
    async processTask(taskId: string): Promise<TaskResult> {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { agent: true },
        });

        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Mark agent as busy
        this.activeAgents.set(task.agent.id, true);

        try {
            // Update task status
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: 'RUNNING',
                    startedAt: new Date(),
                },
            });

            // Update agent status
            await prisma.agent.update({
                where: { id: task.agent.id },
                data: { status: 'BUSY' },
            });

            // Execute the task based on agent type
            const result = await this.executeAgentTask(task.agent, task);

            // Update task with result
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: result.success ? 'COMPLETED' : 'FAILED',
                    result: (result.data || {}) as any,
                    reasoning: (result.reasoning || []) as any,
                    completedAt: new Date(),
                    error: result.error,
                },
            });

            // Create notification
            if (task.projectId) {
                const project = await prisma.project.findUnique({
                    where: { id: task.projectId },
                });

                if (project) {
                    await prisma.notification.create({
                        data: {
                            userId: project.userId,
                            title: 'Task Completed',
                            message: `${task.agent.name} completed: ${task.title}`,
                            type: 'TASK_COMPLETED',
                            data: { taskId, result } as any,
                        },
                    });
                }
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: 'FAILED',
                    error: errorMessage,
                    completedAt: new Date(),
                },
            });

            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            // Mark agent as idle
            this.activeAgents.set(task.agent.id, false);

            await prisma.agent.update({
                where: { id: task.agent.id },
                data: { status: 'IDLE' },
            });

            // Process next task in queue if any
            const nextTaskId = this.taskQueue.shift();
            if (nextTaskId && nextTaskId !== taskId) {
                this.processTask(nextTaskId).catch(console.error);
            }
        }
    }

    /**
     * Execute a task using OpenAI
     */
    private async executeAgentTask(agent: any, task: any): Promise<TaskResult> {
        try {
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: agent.systemPrompt || `You are ${agent.name}, a specialized AI agent.`,
                },
                {
                    role: 'user',
                    content: `Task: ${task.title}\n\nDescription: ${task.description}\n\nAdditional Input: ${JSON.stringify(task.input)}`,
                },
            ];

            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages,
                temperature: 0.7,
                max_tokens: 2000,
            });

            const response = completion.choices[0]?.message?.content || '';

            return {
                success: true,
                data: {
                    response,
                    model: completion.model,
                    usage: completion.usage,
                },
                reasoning: [
                    {
                        step: 1,
                        description: 'Analyzed task requirements',
                    },
                    {
                        step: 2,
                        description: 'Generated response using AI',
                    },
                ],
            };
        } catch (error) {
            throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get agent status
     */
    async getAgentStatus(agentId: string) {
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: {
                tasks: {
                    orderBy: { assignedAt: 'desc' },
                    take: 10,
                },
            },
        });

        return agent;
    }

    /**
     * Get all active tasks
     */
    async getActiveTasks() {
        return prisma.task.findMany({
            where: {
                status: {
                    in: ['PENDING', 'RUNNING'],
                },
            },
            include: {
                agent: true,
            },
            orderBy: {
                priority: 'desc',
            },
        });
    }

    /**
     * Cancel a task
     */
    async cancelTask(taskId: string) {
        await prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'CANCELLED',
                completedAt: new Date(),
            },
        });

        // Remove from queue
        this.taskQueue = this.taskQueue.filter(id => id !== taskId);
    }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
