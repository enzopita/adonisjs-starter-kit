import type { HttpContext } from '@adonisjs/core/http';

import PlatformAdmin from '#access/models/platform_admin';

/**
 * @tags Admin
 */
export default class MeController {
  /**
   * Show the signed-in user's admin access
   *
   * Any signed-in user may call it. `platformAdmin` tells the frontend whether to show the admin
   * area. `twoFactorRequired` is true for a platform admin who has not confirmed two-factor
   * authentication: every other admin route refuses them until they do.
   */
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail();

    // Reads `platform_admins` rather than the `can` ability, which denies an admin without
    // two-factor.
    const platformAdmin = Boolean(
      await PlatformAdmin.findBy('userId', user.id)
    );

    return await serialize({
      platformAdmin,
      twoFactorRequired: platformAdmin && !user.twoFactorConfirmedAt,
    });
  }
}
