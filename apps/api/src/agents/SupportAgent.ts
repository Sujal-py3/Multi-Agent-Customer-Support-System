import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { AGENT_PROMPTS } from '../lib/agents'

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
})
const model = groq('llama-3.3-70b-versatile')

export class SupportAgent {
    async handle(query: string, history: any[]): Promise<string> {
        console.log('[SupportAgent] Handling query...')

        try {
            console.log(`[SupportAgent] Calling LLM with history length: ${history.length}`)
            const { text } = await generateText({
                model,
                system: AGENT_PROMPTS.SUPPORT,
                messages: history // History already contains the user message
            })

            console.log('[SupportAgent] Execution completed.')
            return text
        } catch (error) {
            console.error('[SupportAgent] Error:', error)
            return "I'm sorry, I'm having trouble processing your request right now. How else can I help you?"
        }
    }
}
