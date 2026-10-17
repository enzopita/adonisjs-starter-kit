import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import GetTenant from '#admin/queries/get_tenant'
import type { HttpContext } from '@adonisjs/core/http'
import ListTenants from '#admin/queries/list_tenants'
import RenameTenant from '#admin/actions/rename_tenant'
import TenantTransformer from '#tenancy/transformers/tenant_transformer'
import AdminMemberTransformer from '#admin/transformers/admin_member_transformer'
import AdminTenantTransformer from '#admin/transformers/admin_tenant_transformer'
import {
  listTenantsValidator,
  renameTenantValidator,
  tenantParamsValidator,
} from '#admin/validators/tenant'

export default class TenantsController {
  async index({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { search, page, perPage } = await request.validateUsing(listTenantsValidator)

    const { rows, meta } = await new ListTenants().handle({
      search,
      page: page ?? 1,
      perPage: perPage ?? 20,
    })

    return serialize(AdminTenantTransformer.paginate(rows, meta))
  }

  async show({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { params } = await request.validateUsing(tenantParamsValidator)

    const { tenant, members } = await new GetTenant().handle({ id: params.id })

    return serialize({
      tenant: TenantTransformer.transform(tenant),
      // Depth 3: members -> user -> avatar.
      members: AdminMemberTransformer.transform(members).depth(3),
    })
  }

  async update({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { params, name } = await request.validateUsing(renameTenantValidator)

    const tenant = await new RenameTenant().handle({ id: params.id, name })

    return serialize(TenantTransformer.transform(tenant))
  }
}
