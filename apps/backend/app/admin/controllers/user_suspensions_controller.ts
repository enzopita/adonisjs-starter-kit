import type { HttpContext } from '@adonisjs/core/http';

import { can } from '#access/abilities';
import { PERMISSIONS } from '#access/permissions';
import SetUserDisabled from '#admin/actions/set_user_disabled';
import { userParamsValidator } from '#admin/validators/user';

/**
 * @tags Admin
 */
export default class UserSuspensionsController {
  /**
   * Disable a user
   *
   * Requires `platform.admin`. Signs the user out everywhere and blocks their sign-in. Disabling
   * a user who is already disabled keeps their first disable date. Records an audit event.
   *
   * @response {403} Not a platform admin
   * @response {404} User not found
   */
  async store(ctx: HttpContext) {
    return await this.set(ctx, true);
  }

  /**
   * Enable a disabled user
   *
   * Requires `platform.admin`. Records an audit event.
   *
   * @response {403} Not a platform admin
   * @response {404} User not found
   */
  async destroy(ctx: HttpContext) {
    return await this.set(ctx, false);
  }

  private async set(
    { bouncer, request, serialize }: HttpContext,
    disabled: boolean
  ) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin);
    const { params } = await request.validateUsing(userParamsValidator);

    const user = await new SetUserDisabled().handle({
      id: params.id,
      disabled,
    });

    return await serialize({ id: user.id, disabledAt: user.disabledAt });
  }
}
