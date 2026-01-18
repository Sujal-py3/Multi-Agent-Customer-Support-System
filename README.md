# Multi-Agent Customer Support System

A robust, AI-powered customer support platform featuring a Router Agent that intelligently delegates tasks to specialized sub-agents (Support, Order, Billing). Built with **Hono**, **React**, and **Groq**.

## Features

- **Multi-Agent Architecture**: 
  - **Router Agent**: Classifies intent and delegates.
  - **Specialized Agents**: 
    - `Order Agent`: Checks DB for status/modifications.
    - `Billing Agent`: Handles invoice/refund queries.
    - `Support Agent`: General troubleshooting.
- **Tech Stack**:
  - **Backend**: Hono (Node.js), Vercel AI SDK, Prisma.
  - **Frontend**: React, Vite, Tailwind CSS.
  - **Database**: PostgreSQL.
  - **Monorepo**: Turborepo.
- **Bonuses**:
  - End-to-End Type Safety (Hono RPC).
  - Rate Limiting Middleware.
  - Context Compaction for long chats.
  - "Thinking" UI State.

## Quick Start

1. **Install**: `npm install`
2. **Env**: Set `GROQ_API_KEY` (apps/api), `WORKFLOW_API_KEY` (apps/api), and `DATABASE_URL` (packages/database).
3. **Db**: `npm run db:push && npm run db:seed`
4. **Run**: `npm run dev`

## API Routes matches Requirements
- `/api/chat/messages`: Post message (Streaming)
- `/api/chat/conversations`: History management
- `/api/agents`: Capabilities discovery
