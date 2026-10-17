import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { runInAuditScope } from '#core/audit/scope'

/** Gives the request an audit scope, so what it records names who did it and from where. */
export default class AuditScopeMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    return runInAuditScope({ ctx, recorded: 0 }, next)
  }
}
