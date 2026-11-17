import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import vine from '@vinejs/vine';

import { audit } from '#core/audit/main';
import InvalidTenantHeaderException from '#tenancy/exceptions/invalid_tenant_header_exception';
import TenantAccessDeniedException from '#tenancy/exceptions/tenant_access_denied_exception';
import TenantSuspendedException from '#tenancy/exceptions/tenant_suspended_exception';
import Tenant from '#tenancy/models/tenant';
import { runInTenant } from '#tenancy/tenant_context';
import type {} from '#tenancy/types/audit';

/**
 * Resolves the tenant named by the X-Tenant-Id header and runs the rest of the
 * request inside it. Must run after `auth`. An unknown tenant and one the user
 * doesn't belong to get the same 403, so ids can't be probed; only the second
 * is recorded, on the tenant's own trail.
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const tenantId = ctx.request.header('x-tenant-id');

    if (tenantId === undefined || !vine.helpers.isUUID(tenantId)) {
      throw new InvalidTenantHeaderException();
    }

    const userId = ctx.auth.getUserOrFail().id;

    const tenant = await Tenant.query()
      .where('id', tenantId)
      .whereHas('memberships', (memberships) => {
        memberships.where('user_id', userId);
      })
      .first();

    if (!tenant) {
      // An unknown id has no tenant to record the attempt on.
      if (await Tenant.find(tenantId)) {
        await audit.note('access.tenant_denied', {
          tenantId,
          subject: null,
          data: {
            route: ctx.route?.pattern ?? null,
            method: ctx.request.method(),
          },
        });
      }

      throw new TenantAccessDeniedException();
    }

    // Only a member learns the tenant is suspended: everyone else got the 403 above.
    if (tenant.suspendedAt) {
      throw new TenantSuspendedException();
    }

    ctx.tenant = tenant;

    await runInTenant(tenant.id, next);
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    tenant: Tenant;
  }
}
