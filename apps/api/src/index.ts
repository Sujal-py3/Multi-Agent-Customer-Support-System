import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorMiddleware } from './middleware/error.middleware';
import agents from './routes/agents';
import chat from './routes/chat';
import health from './routes/health';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/api/chat', chat);
app.route('/api/agents', agents);
app.route('/api/health', health);
export default app;
