import type { HttpContext } from '@adonisjs/core/http'
import UpdateAvatar from '#users/actions/update_avatar'
import { updateAvatarValidator } from '#users/validators/user'
import UserTransformer from '#users/transformers/user_transformer'

/**
 * @tags Account
 */
export default class AvatarController {
  /**
   * Set or remove the avatar
   *
   * `attachmentId` is an image the user uploaded through `POST /attachments`: jpg, jpeg, png or
   * webp, at most 2 MB. Send `null` to remove the avatar. Returns the updated user.
   *
   * @throws {import('#attachments/exceptions/invalid_attachment_exception').default} The attachment is unknown, another user's upload, or not an image of at most 2 MB
   */
  async update({ request, auth, serialize }: HttpContext) {
    const { attachmentId } = await request.validateUsing(updateAvatarValidator)

    const user = await new UpdateAvatar().handle({ user: auth.getUserOrFail(), attachmentId })

    return serialize(UserTransformer.transform(user))
  }
}
