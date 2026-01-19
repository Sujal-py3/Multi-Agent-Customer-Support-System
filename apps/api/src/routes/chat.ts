import { Hono } from 'hono';
import { chatController } from '../controllers/chat.controller';

const chat = new Hono();

chat.post('/messages', chatController.sendMessage);
chat.get('/conversations', chatController.getConversations);
chat.get('/conversations/:id', chatController.getConversation);
chat.delete('/conversations/:id', chatController.deleteConversation);

export default chat;
