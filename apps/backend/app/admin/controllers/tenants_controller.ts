import type { HttpContext } from '@adonisjs/core/http';

import { can } from '#access/abilities';
import { PERMISSIONS } from '#access/permissions';
import RenameTenant from '#admin/actions/rename_tenant';
import GetTenant from '#admin/queries/get_tenant';
import ListTenants from '#admin/queries/list_tenants';
import AdminMemberTransformer from '#admin/transformers/admin_member_transformer';
import AdminTenantTransformer from '#admin/transformers/admin_tenant_transformer';
import {
  listTenantsValidator,
  renameTenantValidator,
  tenantParamsValidator,
} from '#admin/validators/tenant';
import TenantTransformer from '#tenancy/transformers/tenant_transformer';

/**
 * @tags Admin
 */
export default class TenantsController {
  /**
   * List tenants
   *
   * Requires `platform.admin`. Lists every tenant on the platform, ordered by name, with its
   * member count. `search` matches part of the name, ignoring case.
   *
   * @response {403} Not a platform admin
   */
  async index({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin);
    const filters = await request.validateUsing(listTenantsValidator);

    const { rows, meta } = await new ListTenants().handle(filters);

    return serialize(AdminTenantTransformer.paginate(rows, meta));
  }

  /**
   * Show a tenant and its members
   *
   * Requires `platform.admin`. Each member comes with their role name in the tenant (null when
   * they hold none) and whether they are a platform admin.
   *
   * @response {403} Not a platform admin
   * @response {404} Tenant not found
   */
  async show({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin);
    const { params } = await request.validateUsing(tenantParamsValidator);

    const { tenant, members } = await new GetTenant().handle({ id: params.id });

    return serialize({
      tenant: TenantTransformer.transform(tenant),
      // Depth 3: members -> user -> avatar.
      members: AdminMemberTransformer.transform(members).depth(3),
    });
  }

  /**
   * Rename a tenant
   *
   * Requires `platform.admin`. Records an audit event on the tenant's trail.
   *
   * @response {403} Not a platform admin
   * @response {404} Tenant not found
   */
  async update({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin);
    const { params, name } = await request.validateUsing(renameTenantValidator);

    const tenant = await new RenameTenant().handle({ id: params.id, name });

    return serialize(TenantTransformer.transform(tenant));
  }
}
