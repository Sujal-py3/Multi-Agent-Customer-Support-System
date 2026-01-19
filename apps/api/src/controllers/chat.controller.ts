import { Context } from 'hono';
import { agentService } from '../services/agent.service';

export const chatController = {
    async sendMessage(c: Context) {
        try {
            const { message, history, conversationId } = await c.req.json();

            console.log(`[ChatController] receiving message: ${message} (Conversation: ${conversationId || 'none'})`);

            const result = await agentService.handleMessage(message, history || [], conversationId);

            return c.json({
                conversationId: result.conversationId,
                agent: result.agentName,
                text: result.text,
                status: "completed"
            });
        } catch (error: any) {
            console.error(`[ChatController] error: ${error.message}`);
            return c.json({
                success: false,
                error: error.message
            }, 500);
        }
    },

    async getConversations(c: Context) {
        try {
            const conversations = await agentService.listConversations();
            return c.json(conversations);
        } catch (error: any) {
            return c.json({ error: error.message }, 500);
        }
    },

    async getConversation(c: Context) {
        const id = c.req.param('id');
        try {
            const history = await agentService.getConversationHistory(id);
            return c.json({
                conversationId: id,
                messages: history
            });
        } catch (error: any) {
            return c.json({ error: error.message }, 404);
        }
    },

    async deleteConversation(c: Context) {
        const id = c.req.param('id');
        try {
            await agentService.deleteConversation(id);
            return c.json({ success: true });
        } catch (error: any) {
            return c.json({ error: error.message }, 500);
        }
    }
};
