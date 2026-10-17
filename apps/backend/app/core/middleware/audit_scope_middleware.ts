import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { runInAuditScope, type AuditScope } from '#core/audit/scope'
import UnauditedWriteException from '#core/exceptions/unaudited_write_exception'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Gives the request an audit scope, and fails a write that succeeded without recording an
 * event: outside production it answers 500, so the endpoint's first functional test names the
 * omission; in production, where the write already committed, it only logs.
 */
export default class AuditScopeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const scope: AuditScope = { ctx, recorded: 0 }

    await runInAuditScope(scope, next)

    const status = ctx.response.getStatus()
    const succeeded = status >= 200 && status < 300

    if (!WRITE_METHODS.has(ctx.request.method()) || !succeeded || scope.recorded > 0) return

    if (app.inProduction) {
      ctx.logger.error({ route: ctx.route?.pattern }, 'write completed without an audit event')

      return
    }

    throw new UnauditedWriteException()
  }
}
