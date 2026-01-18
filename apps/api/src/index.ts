import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { agentRoutes } from './routes/agents'
import { chatRoutes } from './routes/chat'
import { healthRoute } from './routes/health'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Rate Limiting (Bonus)
import { rateLimiter } from 'hono-rate-limiter'
app.use('/api/*', rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-6',
    keyGenerator: (c) => c.req.header('x-forwarded-for') || 'ip'
}))

// Routes
app.route('/health', healthRoute)
app.route('/api/chat', chatRoutes)
app.route('/api/agents', agentRoutes)

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
    fetch: app.fetch,
    port
})

export type AppType = typeof app
