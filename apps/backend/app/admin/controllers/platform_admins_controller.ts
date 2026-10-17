import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { userParamsValidator } from '#admin/validators/user'
import SetPlatformAdmin from '#admin/actions/set_platform_admin'

export default class PlatformAdminsController {
  async store(ctx: HttpContext) {
    return this.set(ctx, true)
  }

  async destroy(ctx: HttpContext) {
    return this.set(ctx, false)
  }

  private async set({ auth, bouncer, request, serialize }: HttpContext, platformAdmin: boolean) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { params } = await request.validateUsing(userParamsValidator)

    const user = await new SetPlatformAdmin().handle({
      id: params.id,
      platformAdmin,
      actorId: auth.getUserOrFail().id,
    })

    return serialize({ id: user.id, platformAdmin })
  }
}
