import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Hono } from 'hono'
import { rateLimitMiddleware } from './middleware/rateLimit.middleware'


import agentRoutes from './routes/agents'
import chatRoutes from './routes/chat'


const app = new Hono()

app.use('*', rateLimitMiddleware)

app.route('/api/chat', chatRoutes)
app.route('/api/agents', agentRoutes)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

const port = process.env.PORT ? Number(process.env.PORT) : 3000

console.log(`[Server] Starting on port ${port}...`)

serve({
    fetch: app.fetch,
    port,
})

console.log(`[Server] API is live at http://localhost:${port}`)

export type AppType = typeof app

