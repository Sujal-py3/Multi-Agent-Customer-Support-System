import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { orderTool } from '../tools/order.tool';
import { IAgent } from './types';

export class OrderAgent implements IAgent {
    async handle(query: string, _history: any[]): Promise<string> {
        console.log("[OrderAgent] start");

        // Extract orderId (e.g., order-123)
        const orderIdMatch = query.match(/order-\w+/i);
        const orderId = orderIdMatch ? orderIdMatch[0] : null;

        if (!orderId) {
            console.log("[OrderAgent] end: no orderId found");
            return "I can help with your order. Please provide an order ID like 'order-123'.";
        }

        // Call tools
        console.log(`[OrderAgent] tool call: fetching order ${orderId}`);
        try {
            const order = await orderTool.getOrderById(orderId);
            const delivery = await orderTool.getDeliveryStatus(orderId);

            const { text } = await generateText({
                model: groq('llama-3.1-8b-instant'),
                system: `You are an Order Support agent. Use the provided tool data to answer the user's question about order ${orderId}. Be extremely concise. Answer in 1-2 sentences max. Do NOT offer extra help or pleasantries.
            Tool Data:
            - Order Status: ${order.status}
            - Delivery Info: ${delivery.deliveryText}`,
                messages: [
                    ..._history.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
                        content: m.content
                    })),
                    { role: 'user', content: query }
                ]
            });

            console.log("[OrderAgent] end");
            return text;
        } catch (error) {
            console.log(`[OrderAgent] order not found: ${orderId}`);
            return "order not present.";
        }
    }
}

export const orderAgent = new OrderAgent();
