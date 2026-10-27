import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { userParamsValidator } from '#admin/validators/user'
import SetPlatformAdmin from '#admin/actions/set_platform_admin'

/**
 * @tags Admin
 */
export default class PlatformAdminsController {
  /**
   * Grant platform admin access to a user
   *
   * Requires `platform.admin`. The user gets `platform.admin` in every tenant, and must confirm
   * two-factor authentication before they can use the admin area. Records an audit event.
   *
   * @throws {403} Not a platform admin
   * @throws {404} User not found
   */
  async store(ctx: HttpContext) {
    return this.set(ctx, true)
  }

  /**
   * Revoke a user's platform admin access
   *
   * Requires `platform.admin`. Admins cannot revoke their own access, so at least one platform
   * admin always remains. Records an audit event.
   *
   * @throws {403} Not a platform admin
   * @throws {404} User not found
   * @throws {import('#admin/exceptions/cannot_revoke_self_exception').default} The caller tried to revoke their own access
   */
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
