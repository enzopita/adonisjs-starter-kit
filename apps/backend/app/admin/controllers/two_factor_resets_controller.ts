import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { userParamsValidator } from '#admin/validators/user'
import ResetTwoFactor from '#admin/actions/reset_two_factor'

/**
 * @tags Admin
 */
export default class TwoFactorResetsController {
  /**
   * Reset a user's two-factor authentication
   *
   * Requires `platform.admin`. For a user who lost their device. Turns off two-factor
   * authentication, signs the user out everywhere, and emails them a password reset link: they
   * cannot sign in until they choose a new password. Not idempotent: a repeat answers `409`
   * because two-factor is no longer enabled. Records an audit event.
   *
   * @throws {403} Not a platform admin
   * @throws {404} User not found
   * @throws {import('#admin/exceptions/platform_admin_protected_exception').default | import('#admin/exceptions/user_disabled_exception').default | import('#auth/exceptions/two_factor_not_enabled_exception').default} The user is a platform admin, is disabled, or has no two-factor enabled
   */
  async destroy({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { params } = await request.validateUsing(userParamsValidator)

    const { user } = await new ResetTwoFactor().handle({
      id: params.id,
      protectPlatformAdmins: true,
    })

    return serialize({ id: user.id, twoFactorEnabled: false })
  }
}
