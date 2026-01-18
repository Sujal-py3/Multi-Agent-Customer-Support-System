import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { AGENT_PROMPTS, billingTools } from '../lib/agents'

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
})
const model = groq('llama-3.3-70b-versatile')

export class BillingAgent {
    async handle(query: string, history: any[]): Promise<string> {
        console.log('[BillingAgent] Handling billing query...')

        try {
            console.log(`[BillingAgent] Calling Llama-70B for query: "${query.substring(0, 30)}..."`)
            const { text, steps } = await generateText({
                model,
                system: AGENT_PROMPTS.BILLING,
                messages: history, // History already contains the message
                tools: billingTools,
                maxSteps: 5,
                onStepFinish: (step: any) => {
                    console.log(`[BillingAgent Step] Tool calls: ${step.toolCalls.length}, Tool results: ${step.toolResults.length}`)
                }
            } as any)

            console.log(`[BillingAgent] Final steps: ${steps?.length}, Text length: ${text.length}`)
            return text
        } catch (error) {
            console.error('[BillingAgent] Error:', error)
            return "I'm having trouble with the billing system. Please check back later or contact us if this is urgent."
        }
    }
}
