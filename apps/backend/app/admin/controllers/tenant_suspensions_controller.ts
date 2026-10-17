import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { tenantParamsValidator } from '#admin/validators/tenant'
import SetTenantSuspension from '#admin/actions/set_tenant_suspension'
import TenantTransformer from '#tenancy/transformers/tenant_transformer'

export default class TenantSuspensionsController {
  async store(ctx: HttpContext) {
    return this.set(ctx, true)
  }

  async destroy(ctx: HttpContext) {
    return this.set(ctx, false)
  }

  private async set({ bouncer, request, serialize }: HttpContext, suspended: boolean) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { params } = await request.validateUsing(tenantParamsValidator)

    const tenant = await new SetTenantSuspension().handle({ id: params.id, suspended })

    return serialize(TenantTransformer.transform(tenant))
  }
}
