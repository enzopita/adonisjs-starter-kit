import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import * as abilities from '#access/abilities'
import { Bouncer, errors } from '@adonisjs/bouncer'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { PermissionDenial } from '#access/permission_denial'

/**
 * Records a refused `authorize()` inside a tenant as `access.denied`. Outside any tenant only
 * platform admins pass, and no screen would list the refusal, so nothing is recorded there.
 */
async function auditDenial(
  ctx: HttpContext,
  error: InstanceType<typeof errors.E_AUTHORIZATION_FAILURE>,
) {
  const denial = error.response

  if (!(denial instanceof PermissionDenial) || !denial.tenantId) return

  await audit.note('access.denied', {
    tenantId: denial.tenantId,
    subject: null,
    data: {
      permission: denial.permission,
      route: ctx.route?.pattern ?? null,
      method: ctx.request.method(),
    },
  })
}

export default class InitializeBouncerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const bouncer = new Bouncer(() => ctx.auth.user ?? null, abilities).setContainerResolver(
      ctx.containerResolver,
    )

    // Wrapped where it throws: the exception handler answers the request before any middleware
    // sees the error, and `allows()` probes, which never throw, must not record.
    const authorize = bouncer.authorize.bind(bouncer)

    // SAFETY: the wrapper takes and returns what authorize does; it only adds the audit.
    bouncer.authorize = (async (...args: Parameters<typeof authorize>) => {
      try {
        await authorize(...args)
      } catch (error) {
        if (error instanceof errors.E_AUTHORIZATION_FAILURE) await auditDenial(ctx, error)

        throw error
      }
    }) as typeof bouncer.authorize

    ctx.bouncer = bouncer

    return next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    bouncer: Bouncer<Exclude<HttpContext['auth']['user'], undefined>, typeof abilities>
  }
}
