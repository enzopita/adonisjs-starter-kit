import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

import PlatformAdmin from '#access/models/platform_admin';
import TwoFactorRequiredException from '#admin/exceptions/two_factor_required_exception';

/**
 * A platform admin without confirmed two-factor authentication can't use the admin area. Anyone
 * else passes, to get the route's own authorization failure. Confirming two-factor revokes every
 * other session, so a confirmed account's session has passed a second factor. It reads
 * `platform_admins` itself: the `can` ability denies such an admin `platform.admin`, which would
 * make them look like anyone else.
 */
export default class RequireTwoFactorMiddleware {
  async handle({ auth }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail();

    if (
      !user.twoFactorConfirmedAt &&
      (await PlatformAdmin.findBy('userId', user.id))
    ) {
      throw new TwoFactorRequiredException();
    }

    return next();
  }
}
