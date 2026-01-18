import { Bot, Cpu, Send, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useChat } from './hooks/useChat'
import { api } from './lib/api'

function App() {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<any[]>([])

    const { messages, input, handleInputChange, handleSubmit, activeAgent } = useChat(conversationId)

    // Load conversations
    useEffect(() => {
        api.chat.conversations.$get().then(async (res) => {
            if (res.ok) setConversations(await res.json())
        })
    }, [])

    const startNewChat = () => setConversationId(null)

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
                <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Cpu className="text-blue-400" /> AgentSys
                </h1>
                <button
                    onClick={startNewChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mb-4"
                >
                    + New Chat
                </button>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setConversationId(conv.id)}
                            className={`p-2 rounded cursor-pointer truncate ${conversationId === conv.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                        >
                            {conv.messages[0]?.content.substring(0, 30) || 'Empty Chat'}...
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <Cpu className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>How can I help you today?</p>
                        </div>
                    )}

                    {messages.map(m => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-lg flex gap-3 ${m.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'
                                }`}>
                                <div className="mt-1">
                                    {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div>
                                    <p className="whitespace-pre-wrap">{m.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {activeAgent && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-gray-800/50 border border-gray-700/50 px-4 py-2 rounded-full text-sm text-gray-400 flex items-center gap-2">
                                <Cpu size={14} className="animate-spin" />
                                {activeAgent} is thinking...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                    <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask about your order #123..."
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            disabled={!input.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default App
