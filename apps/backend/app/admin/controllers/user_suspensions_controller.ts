import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { userParamsValidator } from '#admin/validators/user'
import SetUserDisabled from '#admin/actions/set_user_disabled'

export default class UserSuspensionsController {
  async store(ctx: HttpContext) {
    return this.set(ctx, true)
  }

  async destroy(ctx: HttpContext) {
    return this.set(ctx, false)
  }

  private async set({ bouncer, request, serialize }: HttpContext, disabled: boolean) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { params } = await request.validateUsing(userParamsValidator)

    const user = await new SetUserDisabled().handle({ id: params.id, disabled })

    return serialize({ id: user.id, disabledAt: user.disabledAt })
  }
}
