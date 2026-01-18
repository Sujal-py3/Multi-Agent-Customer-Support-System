import { useEffect, useState } from 'react'

export interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
}

export function useChat(conversationId: string | null) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [activeAgent, setActiveAgent] = useState<string | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInput(e.target.value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        }

        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setIsLoading(true)
        setActiveAgent('Router')

        try {
            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    conversationId
                })
            })

            if (!response.ok) throw new Error('Failed to fetch response')

            const data = await response.json()
            console.log('[DEBUG] API Response:', data)

            if (!data.text) {
                console.error('[DEBUG] data.text is empty or undefined!')
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.text || "((Empty response recorded. Check console.))"
            }])
            setActiveAgent(data.agentName || null)

        } catch (error) {
            console.error('[Chat Error]', error)
            alert('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
            // Keep active agent visible for a moment or clear it
            setTimeout(() => setActiveAgent(null), 2000)
        }
    }

    // Load history when conversationId changes
    useEffect(() => {
        if (conversationId) {
            console.log(`[useChat] Fetching history for: ${conversationId}`)
            const fetchHistory = async () => {
                try {
                    const res = await fetch(`/api/chat/conversations/${conversationId}`)
                    if (res.ok) {
                        const data = await res.json()
                        console.log(`[useChat] History loaded: ${data.messages?.length} messages`)
                        setMessages(data.messages.map((m: any) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content
                        })))
                    } else {
                        console.error('[useChat] Failed to load history:', res.statusText)
                    }
                } catch (err) {
                    console.error('[useChat] History fetch error:', err)
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
        isLoading,
        handleInputChange,
        handleSubmit,
        activeAgent
    }
}
