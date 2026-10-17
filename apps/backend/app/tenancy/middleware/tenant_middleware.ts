import vine from '@vinejs/vine'
import { audit } from '#core/audit/main'
import type {} from '#tenancy/types/audit'
import Tenant from '#tenancy/models/tenant'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { runInTenant } from '#tenancy/tenant_context'

/**
 * Resolves the tenant named by the X-Tenant-Id header and runs the rest of the
 * request inside it. Must run after `auth`. An unknown tenant and one the user
 * doesn't belong to get the same 403, so ids can't be probed; only the second
 * is recorded, on the tenant's own trail.
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const tenantId = ctx.request.header('x-tenant-id')

    if (!tenantId || !vine.helpers.isUUID(tenantId)) {
      return ctx.response.badRequest({
        message: ctx.i18n.t('errors.E_INVALID_TENANT_HEADER'),
        key: 'E_INVALID_TENANT_HEADER',
      })
    }

    const userId = ctx.auth.getUserOrFail().id

    const tenant = await Tenant.query()
      .where('id', tenantId)
      .whereHas('memberships', memberships => memberships.where('user_id', userId))
      .first()

    if (!tenant) {
      // An unknown id has no tenant to record the attempt on.
      if (await Tenant.find(tenantId)) {
        await audit.note('access.tenant_denied', {
          tenantId,
          subject: null,
          data: { route: ctx.route?.pattern ?? null, method: ctx.request.method() },
        })
      }

      return ctx.response.forbidden({
        message: ctx.i18n.t('errors.E_TENANT_ACCESS_DENIED'),
        key: 'E_TENANT_ACCESS_DENIED',
      })
    }

    // Only a member learns the tenant is suspended: everyone else got the 403 above.
    if (tenant.suspendedAt) {
      return ctx.response.forbidden({
        message: ctx.i18n.t('errors.E_TENANT_SUSPENDED'),
        key: 'E_TENANT_SUSPENDED',
      })
    }

    ctx.tenant = tenant

    return runInTenant(tenant.id, () => next())
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    tenant: Tenant
  }
}
