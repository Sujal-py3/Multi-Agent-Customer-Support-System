import { hc } from 'hono/client'
import type { AppType } from '../../../apps/api/src/index'; // Import type from backend

// Initialize Hono Client
// We use a relative path because Vite proxy handles the forwarding to localhost:3000
export const client = hc<AppType>('/')

export const api = client.api
