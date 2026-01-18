import { prisma } from '@repo/database'

export class ChatService {
    async listConversations(userId: string) {
        return prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
        })
    }

    async getHistory(conversationId: string) {
        return prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        })
    }

    async deleteConversation(id: string) {
        return prisma.conversation.delete({ where: { id } })
    }

    async getOrCreateConversation(userId: string, conversationId?: string) {
        if (conversationId) {
            const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
            if (conv) return conv
        }
        // Ensure user exists (Fix for FK constraint error)
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, email: `${userId}@example.com`, name: 'Demo User' }
        })

        return prisma.conversation.create({ data: { userId } })
    }

    async addMessage(conversationId: string, role: 'user' | 'assistant', content: string, agentName?: string) {
        return prisma.message.create({
            data: { conversationId, role, content, agentName }
        })
    }
}
