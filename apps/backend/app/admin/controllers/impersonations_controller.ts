import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { userParamsValidator } from '#admin/validators/user'
import ImpersonateUser from '#admin/actions/impersonate_user'
import UserTransformer from '#users/transformers/user_transformer'

/**
 * @tags Admin
 */
export default class ImpersonationsController {
  /**
   * Impersonate a user
   *
   * Requires `platform.admin`. Answers like sign-in, with the user and an access token that
   * expires after one hour. The frontend uses this token in place of the admin's and keeps the
   * admin's token to switch back. Records an audit event.
   *
   * @throws {403} Not a platform admin
   * @throws {404} User not found
   * @throws {import('#admin/exceptions/platform_admin_protected_exception').default | import('#admin/exceptions/user_disabled_exception').default} The user is a platform admin or is disabled
   */
  async store({ auth, bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { params } = await request.validateUsing(userParamsValidator)

    const { user, token } = await new ImpersonateUser().handle({
      id: params.id,
      impersonatorId: auth.getUserOrFail().id,
    })

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
