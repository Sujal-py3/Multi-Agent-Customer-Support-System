import { createGroq } from '@ai-sdk/groq';
import { billingAgent } from '../agents/BillingAgent';
import { orderAgent } from '../agents/OrderAgent';
import { routerAgent } from '../agents/RouterAgent';
import { supportAgent } from '../agents/SupportAgent';
import prisma from '../db/prisma';

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

export class AgentService {
    async handleMessage(query: string, _history: any[] = [], conversationId?: string) {
        console.log("[AgentService] start processing with persistence");

        // 1. Create or Find Conversation
        let conversation;
        if (conversationId) {
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId }
            });
        }

        if (!conversation) {
            conversation = await prisma.conversation.create({ data: {} });
            console.log(`[AgentService] created new conversation: ${conversation.id}`);
        } else {
            console.log(`[AgentService] found existing conversation: ${conversation.id}`);
        }

        // 2. Save User Message
        console.log("[DB] Saving user message");
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                content: query
            }
        });

        // 3. Context Management (Compaction)
        const MESSAGE_THRESHOLD = 10;
        const totalMessages = await prisma.message.count({ where: { conversationId: conversation.id } });

        // Use a generic type compatible with AI SDK
        let history: { role: 'user' | 'assistant' | 'system', content: string }[] = [];

        if (totalMessages > MESSAGE_THRESHOLD) {
            console.log(`[Compaction] Threshold exceeded (${totalMessages} msgs). Summarizing older context...`);

            // Fetch all messages to split them
            const allMessages = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'asc' },
            });

            // Split: Keep last 5 intact, summarize the rest
            // We exclude the very last one (current user query) from "history" logic usually,
            // but here we just want to build the context *before* the current turn.
            // The 'allMessages' includes the one we JUST saved at index [length-1].

            const recentCount = 5;
            const messagesToSummarize = allMessages.slice(0, allMessages.length - 1 - recentCount);
            const recentMessages = allMessages.slice(allMessages.length - 1 - recentCount, allMessages.length - 1);

            if (messagesToSummarize.length > 0) {
                try {
                    const textToSummarize = messagesToSummarize.map(m => `${m.role}: ${m.content}`).join('\n');
                    const { text: summary } = await generateText({
                        model: groq('llama-3.1-8b-instant'),
                        system: "Summarize the key facts, user intent, and agent actions from this conversation history. Be concise.",
                        prompt: textToSummarize
                    });

                    console.log("[Compaction] Summary generated:", summary);

                    // Inject summary
                    history.push({
                        role: 'system',
                        content: `PREVIOUS CONVERSATION SUMMARY: ${summary}`
                    });
                } catch (err) {
                    console.error("[Compaction] Failed to summarize:", err);
                    // Fallback: just add them raw if summary fails, or skip them
                }
            }

            // Add recent messages verbatim
            recentMessages.forEach(m => {
                history.push({ role: m.role as 'user' | 'assistant', content: m.content });
            });

        } else {
            // Standard fetch (Last 5, skipping current)
            console.log("[DB] Fetching history (skipping current message)");
            const dbHistory = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                skip: 1
            });

            history = dbHistory.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })).reverse();
        }

        // 4. Route the query
        const route = await routerAgent.route(query);
        console.log(`[AgentService] routed to: ${route.agentType}`);

        // 5. Call the appropriate agent with history
        let responseText = "";
        let agentName = "";

        switch (route.agentType) {
            case 'order':
                responseText = await (orderAgent as any).handle(query, history);
                agentName = "OrderAgent";
                break;
            case 'billing':
                responseText = await (billingAgent as any).handle(query, history);
                agentName = "BillingAgent";
                break;
            case 'support':
            default:
                responseText = await supportAgent.handle(query, history, conversation.id);
                agentName = "SupportAgent";
                break;
        }

        // 6. Save Agent Response
        console.log("[DB] Saving agent response");
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: responseText
            }
        });

        console.log("[AgentService] response persisted");

        return {
            text: responseText,
            agentName: agentName,
            conversationId: conversation.id
        };
    }

    async listConversations() {
        return prisma.conversation.findMany({
            select: {
                id: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getConversationHistory(id: string) {
        return prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' }
        });
    }

    async deleteConversation(id: string) {
        // Prisma will handle message deletion if onDelete: Cascade is set, 
        // but let's be explicit if not sure.
        await prisma.message.deleteMany({
            where: { conversationId: id }
        });
        return prisma.conversation.delete({
            where: { id: id }
        });
    }
}

export const agentService = new AgentService();
