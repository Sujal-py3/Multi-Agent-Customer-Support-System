import type { MiddlewareHandler } from 'hono'

export const errorMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('[ErrorMiddleware]', err)

    return c.json(
      {
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Something went wrong'
      },
      500
    )
  }
}
