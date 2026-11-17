import type { HttpContext } from '@adonisjs/core/http';

import { can } from '#access/abilities';
import { PERMISSIONS } from '#access/permissions';
import SetTenantSuspension from '#admin/actions/set_tenant_suspension';
import { tenantParamsValidator } from '#admin/validators/tenant';
import TenantTransformer from '#tenancy/transformers/tenant_transformer';

/**
 * @tags Admin
 */
export default class TenantSuspensionsController {
  /**
   * Suspend a tenant
   *
   * Requires `platform.admin`. Members of a suspended tenant get `403` on every tenant route.
   * Suspending a tenant that is already suspended keeps its first suspension date. Records an
   * audit event.
   *
   * @response {403} Not a platform admin
   * @response {404} Tenant not found
   */
  async store(ctx: HttpContext) {
    return await this.set(ctx, true);
  }

  /**
   * Reactivate a suspended tenant
   *
   * Requires `platform.admin`. Records an audit event.
   *
   * @response {403} Not a platform admin
   * @response {404} Tenant not found
   */
  async destroy(ctx: HttpContext) {
    return await this.set(ctx, false);
  }

  private async set(
    { bouncer, request, serialize }: HttpContext,
    suspended: boolean
  ) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin);
    const { params } = await request.validateUsing(tenantParamsValidator);

    const tenant = await new SetTenantSuspension().handle({
      id: params.id,
      suspended,
    });

    return await serialize(TenantTransformer.transform(tenant));
  }
}
