import app from '@adonisjs/core/services/app'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as bouncerErrors } from '@adonisjs/bouncer'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { Exception } from '@adonisjs/core/exceptions'
import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http'
import type { HttpError } from '@adonisjs/core/types/http'

/**
 * Sends every error as `{ code, message }`, the one body the OpenAPI document describes. The
 * package exceptions below render a body of their own, so `handle()` renders them here instead.
 */
export default class HttpExceptionHandler extends ExceptionHandler {
  protected override debug = !app.inProduction

  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- ExceptionHandler.handle receives whatever was thrown; the instanceof checks below narrow it.
  override async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof Exception && error.code && 'i18n' in ctx) {
      error.message = ctx.i18n.t(`errors.${error.code}`, {}, error.message)
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return ctx.response.unauthorized({
        code: 'E_UNAUTHORIZED_ACCESS' as const,
        message: error.message,
      })
    }

    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      return ctx.response.badRequest({
        code: 'E_INVALID_CREDENTIALS' as const,
        message: error.message,
      })
    }

    if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
      return ctx.response.forbidden({
        code: 'E_AUTHORIZATION_FAILURE' as const,
        message: error.message,
      })
    }

    if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
      for (const [name, value] of Object.entries<string | number>(error.getDefaultHeaders())) {
        ctx.response.header(name, value)
      }

      return ctx.response.tooManyRequests({
        code: 'E_TOO_MANY_REQUESTS' as const,
        message: error.message,
      })
    }

    return super.handle(error, ctx)
  }

  /**
   * A server error never sends its own message, which can carry SQL or driver text. Debug keeps
   * the framework's stack trace for development and tests.
   */
  override async renderErrorAsJSON(error: HttpError, ctx: HttpContext) {
    if (error.status >= 500) {
      if (this.isDebuggingEnabled(ctx)) return super.renderErrorAsJSON(error, ctx)

      const code = 'E_INTERNAL_SERVER_ERROR'

      return ctx.response.status(error.status).send({
        code,
        message: 'i18n' in ctx ? ctx.i18n.t(`errors.${code}`) : 'Internal server error',
      })
    }

    return ctx.response
      .status(error.status)
      .send({ code: error.code ?? 'E_UNKNOWN', message: error.message })
  }
}
