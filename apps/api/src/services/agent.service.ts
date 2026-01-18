import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { AGENT_PROMPTS, billingTools, orderTools } from '../lib/agents'
import { ChatService } from './chat.service'

// Configure Groq Provider
const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY
})
const model = groq('llama-3.3-70b-versatile')
const fastModel = groq('llama-3.1-8b-instant')

export class AgentService {
    private chatService: ChatService

    constructor() {
        this.chatService = new ChatService()
    }

    async processMessage(conversationId: string, userMessage: string) {
        console.log(`[AgentService] Processing message: "${userMessage.substring(0, 50)}..."`)

        try {
            // 1. Save User Message
            await this.chatService.addMessage(conversationId, 'user', userMessage)

            // 2. Fetch History (Context)
            const history = await this.chatService.getHistory(conversationId)
            let messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = history?.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })) || []

            // Bonus: Context Compaction
            if (messages.length > 15) {
                console.log(`[Context] compacting history of length ${messages.length}...`)
                const summaryPlaceholder = {
                    role: 'system' as const,
                    content: `[System Note: Previous conversation summarized: User asked about various topics. Keeping focus on current query.]`
                }
                messages = [messages[0], summaryPlaceholder, ...messages.slice(-5)]
            }

            // 3. Router Step (Classify Intent)
            console.log('[Router] Classifying intent...')
            let targetAgent = 'support' // Safe default

            try {
                const classification = await generateText({
                    model: fastModel,
                    system: AGENT_PROMPTS.ROUTER,
                    messages: [
                        { role: 'user', content: `Context: ${messages.slice(-3).map(m => m.content).join('\n')}\n\nCurrent Query: ${userMessage}` }
                    ]
                })

                const rawIntent = classification.text.trim().toLowerCase()
                console.log(`[Router] Raw output: "${rawIntent}"`)

                // Robust matching
                if (rawIntent.includes('order')) targetAgent = 'order'
                else if (rawIntent.includes('billing')) targetAgent = 'billing'

            } catch (routerError) {
                console.error('[Router] Classification failed, defaulting to Support:', routerError)
            }

            console.log(`[Router] Decision: ${targetAgent}`)

            // 4. Handoff to Specific Agent
            let systemPrompt = AGENT_PROMPTS.SUPPORT
            let tools: any = {}

            if (targetAgent === 'order') {
                systemPrompt = AGENT_PROMPTS.ORDER
                tools = orderTools
            } else if (targetAgent === 'billing') {
                systemPrompt = AGENT_PROMPTS.BILLING
                tools = billingTools
            }

            // 5. Generate Response (Streaming)
            console.log(`[Agent] Starting generation with ${targetAgent} agent...`)

            const result = await streamText({
                model,
                system: systemPrompt,
                messages, // Pass full history
                tools,
                maxSteps: 10,
                onStepFinish: (step) => {
                    console.log(`[Step] Completed. Tool calls: ${step.toolCalls.length}`)
                    step.toolCalls.forEach(tc => console.log(`[Tool Call] ${tc.toolName}(${JSON.stringify(tc.args)})`))
                    step.toolResults.forEach(tr => console.log(`[Tool Result] ${tr.toolName} -> ${JSON.stringify(tr.result).substring(0, 100)}`))
                },
                onFinish: async (event) => {
                    console.log(`[Agent] Response complete. Saving to DB.`)
                    // Save Assistant Response
                    await this.chatService.addMessage(conversationId, 'assistant', event.text, targetAgent)
                }
            })

            // Try to handle version mismatch gracefully
            const resultAny = result as any
            if (typeof resultAny.toDataStreamResponse === 'function') {
                return resultAny.toDataStreamResponse()
            } else if (typeof resultAny.toTextStreamResponse === 'function') {
                console.log('[Agent] Fallback to toTextStreamResponse')
                return resultAny.toTextStreamResponse()
            } else {
                console.log('[Agent] Unknown result structure, returning raw stream')
                return new Response(resultAny, {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                })
            }

        } catch (error) {
            console.error('[AgentService] Critical Error:', error)
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : String(error)
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }
    }
}
