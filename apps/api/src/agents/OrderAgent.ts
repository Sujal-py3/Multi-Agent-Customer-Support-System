import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { AGENT_PROMPTS, orderTools } from '../lib/agents'

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
})
const model = groq('llama-3.3-70b-versatile')

export class OrderAgent {
    async handle(query: string, history: any[]): Promise<string> {
        console.log('[OrderAgent] Handling order query...')

        try {
            console.log(`[OrderAgent] Calling Llama-70B for query: "${query.substring(0, 30)}..."`)
            const { text, steps } = await generateText({
                model,
                system: AGENT_PROMPTS.ORDER,
                messages: history,
                tools: orderTools,
                maxSteps: 5,
                onStepFinish: (step: any) => {
                    console.log(`[OrderAgent Step] Tool calls: ${step.toolCalls.length}, Tool results: ${step.toolResults.length}`)
                }
            } as any)

            console.log(`[OrderAgent] Final LLM steps: ${steps?.length}, Text length: ${text.length}`)

            console.log('[OrderAgent] LLM Response received successfully.')
            return text
        } catch (error) {
            console.error('[OrderAgent] Error:', error)
            return "I'm having trouble accessing the order system. Please try again later or provide your order ID."
        }
    }
}
