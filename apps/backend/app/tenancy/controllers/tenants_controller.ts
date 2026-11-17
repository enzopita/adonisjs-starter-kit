import type { HttpContext } from '@adonisjs/core/http';

import CreateTenant from '#tenancy/actions/create_tenant';
import Tenant from '#tenancy/models/tenant';
import TenantTransformer from '#tenancy/transformers/tenant_transformer';
import { createTenantValidator } from '#tenancy/validators/tenant';

/**
 * @tags Tenants
 */
export default class TenantsController {
  /**
   * List the signed-in user's tenants
   *
   * Returns the tenants the signed-in user is a member of, suspended ones included, sorted
   * by name. Send a tenant's id in the X-Tenant-Id header to act inside it.
   */
  async index({ auth, serialize }: HttpContext) {
    const userId = auth.getUserOrFail().id;

    const tenants = await Tenant.query()
      .whereHas('memberships', (memberships) => {
        memberships.where('user_id', userId);
      })
      .orderBy('name');

    return await serialize(TenantTransformer.transform(tenants));
  }

  /**
   * Create a tenant
   *
   * The signed-in user becomes its first member and holds an Owner role with every
   * permission, named in the request's language.
   */
  async store({ request, auth, i18n, serialize }: HttpContext) {
    const { name } = await request.validateUsing(createTenantValidator);

    const tenant = await new CreateTenant().handle({
      name,
      creatorId: auth.getUserOrFail().id,
      locale: i18n.locale,
    });

    return await serialize(TenantTransformer.transform(tenant));
  }
}
