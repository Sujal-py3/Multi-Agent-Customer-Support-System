import { BillingAgent } from '../agents/BillingAgent'
import { OrderAgent } from '../agents/OrderAgent'
import { RouterAgent } from '../agents/RouterAgent'
import { SupportAgent } from '../agents/SupportAgent'
import { ChatService } from './chat.service'

export class AgentService {
    private chatService: ChatService
    private router: RouterAgent
    private support: SupportAgent
    private order: OrderAgent
    private billing: BillingAgent

    constructor() {
        this.chatService = new ChatService()
        this.router = new RouterAgent()
        this.support = new SupportAgent()
        this.order = new OrderAgent()
        this.billing = new BillingAgent()
    }

    async processMessage(conversationId: string, userMessage: string): Promise<{ text: string, agentName: string }> {
        console.log(`[AgentService] Orchestrating message for conversation: ${conversationId}`)

        try {
            // 1. Save User Message
            await this.chatService.addMessage(conversationId, 'user', userMessage)

            // 2. Fetch History
            const historyData = await this.chatService.getHistory(conversationId)
            const history = historyData?.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })) || []

            // 3. Route Query
            const context = history.slice(-3).map(m => m.content).join('\n')
            const { agentType } = await this.router.handle(userMessage, context)
            console.log(`[AgentService] Routed to: ${agentType}`)

            // 4. Delegate to Specialized Agent
            let responseText: string
            let agentName = agentType

            if (agentType === 'order') {
                responseText = await this.order.handle(userMessage, history)
            } else if (agentType === 'billing') {
                responseText = await this.billing.handle(userMessage, history)
            } else {
                responseText = await this.support.handle(userMessage, history)
                agentName = 'support'
            }

            // 5. Save and Return Result
            if (!responseText || responseText.trim().length === 0) {
                console.warn(`[AgentService] Warning: Empty response from ${agentName}. Using fallback.`)
                responseText = "I've received your message but I'm having trouble generating a specific answer right now. Is there anything specific about your order or billing you'd like to know?"
            }

            console.log(`[AgentService] Final response length: ${responseText.length}`)
            await this.chatService.addMessage(conversationId, 'assistant', responseText, agentName)

            return { text: responseText, agentName }

        } catch (error) {
            console.error('[AgentService] Process error:', error)
            // Fallback to support even on orchestration failure
            const fallbackText = "I encounter an internal error while processing your request. Let me try to help you as a general support agent: I'm sorry for the inconvenience."
            return { text: fallbackText, agentName: 'support' }
        }
    }
}
