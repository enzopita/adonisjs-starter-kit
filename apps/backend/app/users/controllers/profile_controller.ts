import type { HttpContext } from '@adonisjs/core/http';

import UpdateProfile from '#users/actions/update_profile';
import UserTransformer from '#users/transformers/user_transformer';
import { updateProfileValidator } from '#users/validators/user';

/**
 * @tags Account
 */
export default class ProfileController {
  /**
   * Show the signed-in user's profile
   */
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail();
    await user.load((preloader) => preloader.load('avatar'));

    return serialize(UserTransformer.transform(user));
  }

  /**
   * Update the profile
   *
   * Changes the locale, the time zone, or both. A field left out keeps its value. Returns the
   * updated user.
   */
  async update({ auth, request, serialize }: HttpContext) {
    const { locale, timezone } = await request.validateUsing(
      updateProfileValidator
    );

    const user = await new UpdateProfile().handle({
      user: auth.getUserOrFail(),
      locale,
      timezone,
    });
    await user.load((preloader) => preloader.load('avatar'));

    return serialize(UserTransformer.transform(user));
  }
}
