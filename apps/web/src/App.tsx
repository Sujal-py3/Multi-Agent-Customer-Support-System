import { useEffect, useRef, useState } from 'react'
import './App.css'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

function App() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [conversationId, setConversationId] = useState<string | undefined>()
    const [loading, setLoading] = useState(false)
    const [loadingText, setLoadingText] = useState('Thinking...')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const loadingPhrases = [
        "Thinking...",
        "Searching orders...",
        "Checking billing details...",
        "Reviewing history...",
        "Formulating response..."
    ]

    useEffect(() => {
        let interval: any
        if (loading) {
            let i = 0
            interval = setInterval(() => {
                i = (i + 1) % loadingPhrases.length
                setLoadingText(loadingPhrases[i])
            }, 2000)
        } else {
            setLoadingText("Thinking...") // Reset
        }
        return () => clearInterval(interval)
    }, [loading])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim()) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    conversationId: conversationId
                }),
            })

            const data = await response.json()

            if (data.conversationId) {
                setConversationId(data.conversationId)
            }

            const assistantMessage: Message = { role: 'assistant', content: data.text }
            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Error:', error)
            const errorMessage: Message = { role: 'assistant', content: 'Oops! Something went wrong.' }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="chat-container">
            <h1>AI Customer Support</h1>
            <div className="messages-list">
                {messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`}>
                        <div className="bubble">
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && <div className="message assistant loading"><div className="bubble">{loadingText}</div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask me anything..."
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()}>
                    Send
                </button>
            </div>
        </div>
    )
}

export default App
