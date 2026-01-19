
import { Context, Next } from 'hono';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 50;

export const rateLimitMiddleware = async (c: Context, next: Next) => {
    // Basic IP retrieval (fallback to 'unknown' if not found)
    const ip = c.req.header('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();

    const record = rateLimitMap.get(ip);

    if (!record) {
        // New record
        rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else {
        if (now > record.resetTime) {
            // Window expired, reset
            record.count = 1;
            record.resetTime = now + WINDOW_MS;
            rateLimitMap.set(ip, record);
        } else {
            // Within window
            if (record.count >= MAX_REQUESTS) {
                console.warn(`[RateLimit] Blocked ${ip} - Limit exceeded`);
                return c.json({ error: 'Too many requests. Please try again later.' }, 429);
            }
            record.count++;
            rateLimitMap.set(ip, record);
        }
    }

    await next();
};
