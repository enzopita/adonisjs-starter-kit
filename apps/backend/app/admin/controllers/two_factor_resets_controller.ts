import type { HttpContext } from '@adonisjs/core/http';

import { can } from '#access/abilities';
import { PERMISSIONS } from '#access/permissions';
import ResetTwoFactor from '#admin/actions/reset_two_factor';
import { userParamsValidator } from '#admin/validators/user';

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
   * @response {403} Not a platform admin
   * @response {404} User not found
   */
  async destroy({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin);
    const { params } = await request.validateUsing(userParamsValidator);

    const { user } = await new ResetTwoFactor().handle({
      id: params.id,
      protectPlatformAdmins: true,
    });

    return await serialize({ id: user.id, twoFactorEnabled: false });
  }
}
