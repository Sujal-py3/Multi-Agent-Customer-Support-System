import { useChat as useAiChat } from 'ai/react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useChat(conversationId: string | null) {
    const [activeAgent, setActiveAgent] = useState<string | null>(null)

    const { messages, input, handleInputChange, handleSubmit, setMessages, append } = useAiChat({
        api: '/api/chat/messages',
        body: { conversationId },
        onResponse: (response) => {
            // Bonus: Could parse headers for agent name if we sent it
            setActiveAgent('Router') // Default start
        },
        onError: (error) => {
            console.error('[Frontend Error] Chat API failed:', error)
            setActiveAgent(null)

            // Try to extract readable error from JSON if available
            let displayError = error.message
            try {
                // If the error message is a stringified JSON (common in some libs)
                const parsed = JSON.parse(error.message)
                if (parsed.details) displayError = parsed.details
                if (parsed.error) displayError += ` (${parsed.error})`
            } catch (e) { /* ignore */ }

            alert(`Error: ${displayError}`)
        },
        onFinish: () => {
            setActiveAgent(null)
        }
    })

    // Load history when conversationId changes
    useEffect(() => {
        if (conversationId) {
            const fetchHistory = async () => {
                const res = await api.chat.conversations[':id'].$get({ param: { id: conversationId } })
                if (res.ok) {
                    const data = await res.json()
                    // Map DB messages to AI SDK format
                    setMessages(data.messages.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content
                    })))
                }
            }
            fetchHistory()
        } else {
            setMessages([])
        }
    }, [conversationId])

    return {
        messages,
        input,
        handleInputChange,
        handleSubmit: (e: React.FormEvent) => {
            handleSubmit(e, { body: { conversationId } })
        },
        activeAgent
    }
}
