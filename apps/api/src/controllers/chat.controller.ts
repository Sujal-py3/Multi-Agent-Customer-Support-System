import { Context } from 'hono'
import { AgentService } from '../services/agent.service'
import { ChatService } from '../services/chat.service'

export class ChatController {
    private chatService: ChatService
    private agentService: AgentService

    constructor() {
        this.chatService = new ChatService()
        this.agentService = new AgentService()
    }

    getConversations = async (c: Context) => {
        // Mock user ID for now
        const userId = 'user-123'
        const conversations = await this.chatService.listConversations(userId)
        return c.json(conversations)
    }

    getConversationById = async (c: Context) => {
        const id = c.req.param('id')
        const history = await this.chatService.getHistory(id)
        if (!history) return c.json({ error: 'Conversation not found' }, 404)
        return c.json(history)
    }

    deleteConversation = async (c: Context) => {
        const id = c.req.param('id')
        await this.chatService.deleteConversation(id)
        return c.json({ success: true })
    }

    sendMessage = async (c: Context) => {
        console.log('[ChatController] sendMessage called')
        const { messages, conversationId } = await c.req.json()
        const userId = 'user-123' // Mock

        // Extract the last user message
        const lastMessage = messages[messages.length - 1]
        if (!lastMessage || !lastMessage.content) {
            return c.json({ error: 'No message content found' }, 400)
        }

        console.log(`[ChatController] extracted message: "${lastMessage.content}"`)

        // 1. Get or Create Conversation
        // Handle potential null conversationId
        const validConvId = conversationId || undefined
        let conversation
        try {
            console.log(`[ChatController] Fetching conversation: ${validConvId}`)
            conversation = await this.chatService.getOrCreateConversation(userId, validConvId)
            console.log(`[ChatController] Conversation ID: ${conversation?.id}`)
        } catch (dbError) {
            console.error('[ChatController] DB Error:', dbError)
            return c.json({ error: 'Database connection failed' }, 500)
        }

        // 2. Process with Agent Service (Streaming Response)
        return this.agentService.processMessage(conversation.id, lastMessage.content)
    }
}
