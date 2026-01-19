export type AgentType = 'order' | 'billing' | 'support';

export interface RouteResult {
    agentType: AgentType;
    confidence: number;
}

export class RouterAgent {
    async route(query: string): Promise<RouteResult> {
        console.log("[RouterAgent] start classification");

        const lowerQuery = query.toLowerCase();
        let result: RouteResult = { agentType: 'support', confidence: 1.0 };

        if (lowerQuery.includes('order') || lowerQuery.includes('track') || lowerQuery.includes('delivery')) {
            result = { agentType: 'order', confidence: 1.0 };
        } else if (lowerQuery.includes('payment') || lowerQuery.includes('refund') || lowerQuery.includes('invoice')) {
            result = { agentType: 'billing', confidence: 1.0 };
        }

        console.log(`[RouterAgent] decision: ${result.agentType}`);
        return result;
    }
}

export const routerAgent = new RouterAgent();

