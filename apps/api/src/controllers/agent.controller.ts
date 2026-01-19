import { Context } from 'hono';

export const agentController = {
    async listAgents(c: Context) {
        const agents = [
            { type: "support", description: "General support & FAQs" },
            { type: "order", description: "Order tracking & status" },
            { type: "billing", description: "Payments & refunds" }
        ];
        return c.json(agents);
    },

    async getCapabilities(c: Context) {
        const type = c.req.param('type');

        const capabilities: Record<string, string[]> = {
            support: ["General questions", "Route to specialists", "Conversation history"],
            order: ["Order tracking", "Delivery status", "Order details"],
            billing: ["Invoice lookups", "Refund status", "Payment history"]
        };

        const agentCapabilities = capabilities[type] || [];

        return c.json({
            agent: type,
            capabilities: agentCapabilities
        });
    }
};
