import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { ChatController } from '../controllers/chat.controller'

export const chatRoutes = new Hono()

// Controller Instance
const chatController = new ChatController()

// GET /api/chat/conversations - List conversations
chatRoutes.get('/conversations', chatController.getConversations)

// GET /api/chat/conversations/:id - Get conversation history
chatRoutes.get('/conversations/:id', chatController.getConversationById)

// DELETE /api/chat/conversations/:id - Delete conversation
chatRoutes.delete('/conversations/:id', chatController.deleteConversation)

// POST /api/chat/messages - Send new message
chatRoutes.post(
    '/messages',
    async (c, next) => {
        console.log('[API Route] POST /api/chat/messages hit')
        await next()
    },
    zValidator('json', z.object({
        messages: z.array(z.object({
            role: z.string(),
            content: z.string()
        })),
        conversationId: z.string().nullable().optional()
    })),
    chatController.sendMessage
);

