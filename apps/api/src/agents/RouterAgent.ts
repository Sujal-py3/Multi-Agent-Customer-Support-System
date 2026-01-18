import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { AGENT_PROMPTS } from '../lib/agents'

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
})
const model = groq('llama-3.1-8b-instant')

export type AgentType = 'support' | 'order' | 'billing'

export interface RoutingDecision {
    agentType: AgentType
    confidence: number
    reasoning?: string
}

export class RouterAgent {
    async handle(query: string, context: string): Promise<RoutingDecision> {
        console.log('[RouterAgent] Classifying intent...')

        try {
            console.log(`[RouterAgent] Calling LLM with query: "${query.substring(0, 30)}..."`)
            const { text } = await generateText({
                model,
                system: AGENT_PROMPTS.ROUTER,
                messages: [{ role: 'user', content: `Context: ${context}\n\nQuery: ${query}` }]
            })

            const decision = text.trim().toLowerCase()
            console.log(`[RouterAgent] LLM Decision: "${decision}"`)

            if (decision.includes('order')) {
                return { agentType: 'order', confidence: 0.9 }
            }
            if (decision.includes('billing')) {
                return { agentType: 'billing', confidence: 0.9 }
            }

            return { agentType: 'support', confidence: 1.0 }
        } catch (error) {
            console.error('[RouterAgent] Error:', error)
            return { agentType: 'support', confidence: 0.5, reasoning: 'Fallback due to error' }
        }
    }
}
