import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { conversationTool } from '../tools/conversation.tool';
import { IAgent } from './types';

export class SupportAgent implements IAgent {
    async handle(query: string, _history: any[], conversationId?: string): Promise<string> {
        console.log("[SupportAgent] start");

        // Tool call for context (existing requirement)
        await conversationTool.getConversationHistory(conversationId || 'default-id');

        const { text } = await generateText({
            model: groq('llama-3.1-8b-instant'),
            system: "You are a helpful customer support assistant. You provide general information and can help route users. We have exactly three departments: 1. Support Agent (General inquiries, FAQs, troubleshooting), 2. Order Agent (Order status, tracking, modifications, cancellations), 3. Billing Agent (Payment issues, refunds, invoices, subscriptions). ALWAYS check the provided message history for context before answering. If the user refers to a previous message (e.g., 'what did I just say?'), validly answer from the history. Be extremely concise. Answer in 1-2 sentences max.",
            messages: [
                ..._history.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
                    content: m.content
                })),
                { role: 'user', content: query }
            ]
        });

        console.log("[SupportAgent] end");
        return text;
    }
}

export const supportAgent = new SupportAgent();
