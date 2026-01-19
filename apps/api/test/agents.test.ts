import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ===============================
 * 1. Mock AI SDK (hoist-safe)
 * ===============================
 */
vi.mock('ai', () => ({
    generateText: vi.fn().mockImplementation(async ({ system }) => {
        if (system && system.includes('Route the user')) {
            return {
                object: {
                    agentType: 'order',
                    confidence: 0.9,
                    reasoning: 'Mock routing'
                }
            };
        }

        return {
            text: 'Mock AI Response'
        };
    })
}));

vi.mock('@ai-sdk/groq', () => ({
    // For files that do: import { groq } from '@ai-sdk/groq'
    groq: () => ({
        chat: {
            completions: {
                create: vi.fn()
            }
        }
    }),

    // For files that do: import { createGroq } from '@ai-sdk/groq'
    createGroq: () => {
        return () => ({
            chat: {
                completions: {
                    create: vi.fn()
                }
            }
        })
    }
}));

/**
 * ===============================
 * 2. Mock Prisma (HOIST-SAFE)
 * ===============================
 * IMPORTANT:
 * - NO external variables
 * - Everything lives inside the factory
 */
vi.mock('../src/db/prisma', () => {
    return {
        default: {
            conversation: {
                findUnique: vi.fn(),
                create: vi.fn()
            },
            message: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn()
            },
            order: {
                findUnique: vi.fn()
            },
            billing: {
                findFirst: vi.fn()
            }
        }
    };
});

/**
 * ===============================
 * 3. Imports AFTER mocks
 * ===============================
 */
import { routerAgent } from '../src/agents/RouterAgent';
import prisma from '../src/db/prisma';
import { agentService } from '../src/services/agent.service';

/**
 * ===============================
 * 4. Tests
 * ===============================
 */
describe('AI Customer Support System', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('RouterAgent', () => {
        it('routes order queries to OrderAgent', async () => {
            const result = await routerAgent.route('where is my order');
            expect(result.agentType).toBe('order');
        });
    });

    describe('AgentService (Persistence)', () => {
        it('persists user and assistant messages', async () => {
            // Arrange DB mocks
            (prisma.conversation.create as any).mockResolvedValue({ id: 'conv-123' });
            (prisma.message.count as any).mockResolvedValue(0);
            (prisma.message.findMany as any).mockResolvedValue([]);

            // Act
            const result = await agentService.handleMessage('Hello');

            // Assert: user message saved
            expect(prisma.message.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        role: 'user',
                        content: 'Hello'
                    })
                })
            );

            // Assert: assistant message saved
            expect(prisma.message.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        role: 'assistant'
                    })
                })
            );

            expect(result.conversationId).toBe('conv-123');
        });
    });
});
