import prisma from '../db/prisma';

export const conversationTool = {
    async getConversationHistory(conversationId: string) {
        console.log(`[Tool] fetching history for ${conversationId} from DB`);

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return messages.map(m => ({
            role: m.role,
            content: m.content
        }));
    }
};
