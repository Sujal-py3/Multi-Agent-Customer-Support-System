import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { billingTool } from '../tools/billing.tool';
import { IAgent } from './types';

export class BillingAgent implements IAgent {
    async handle(query: string, _history: any[]): Promise<string> {
        console.log("[BillingAgent] start");

        // Extract orderId for billing query
        const orderIdMatch = query.match(/order-\w+/i);
        let orderId = orderIdMatch ? orderIdMatch[0] : null;

        if (!orderId) {
            // Look back through history for an order reference
            const orderMention = [..._history].reverse().find(
                m => m.content.toLowerCase().includes("order-")
            );

            if (orderMention) {
                const match = orderMention.content.match(/order-\w+/i);
                if (match) {
                    orderId = match[0];
                    console.log(`[BillingAgent] inferred orderId from history: ${orderId}`);
                }
            }
        }

        if (!orderId) {
            console.log("[BillingAgent] end: no orderId found");
            return "Please provide your order ID so I can check the payment status.";
        }

        // Call tools
        console.log(`[BillingAgent] tool call: fetching billing for ${orderId}`);
        try {
            const invoice = await billingTool.getInvoiceByOrderId(orderId);
            const refund = await billingTool.getRefundStatus(orderId);

            const { text } = await generateText({
                model: groq('llama-3.1-8b-instant'),
                system: `You are a Billing Support agent. Use the provided tool data to answer the user's question about order ${orderId}. Be extremely concise. Answer in 1-2 sentences max. Do NOT offer extra help or pleasantries.
            Tool Data:
            - Invoice Status: ${invoice.status}
            - Refund Status: ${refund.status}`,
                messages: [
                    ..._history.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
                        content: m.content
                    })),
                    { role: 'user', content: query }
                ]
            });

            console.log("[BillingAgent] end");
            return text;
        } catch (error) {
            console.log(`[BillingAgent] order/billing not found: ${orderId}`);
            return "order not present.";
        }
    }
}

export const billingAgent = new BillingAgent();
