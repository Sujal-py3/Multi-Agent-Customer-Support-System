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

        try {
            console.log('[ChatController] Fetching conversation...')
            const validConvId = conversationId || undefined
            const conversation = await this.chatService.getOrCreateConversation(userId, validConvId)
            console.log(`[ChatController] Conversation ready: ${conversation.id}`)

            // 2. Process with Agent Service (JSON Response)
            console.log('[ChatController] Delegating to AgentService...')
            const result = await this.agentService.processMessage(conversation.id, lastMessage.content)
            console.log('[ChatController] AgentService returned answer.')

            // Explicitly return JSON response
            return c.json({
                text: result.text,
                conversationId: conversation.id,
                agentName: result.agentName
            })

        } catch (error) {
            console.error('[ChatController] Error:', error)
            return c.json({ error: 'Internal Server Error' }, 500)
        }
    }
}
