import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { userParamsValidator } from '#admin/validators/user'
import ImpersonateUser from '#admin/actions/impersonate_user'
import UserTransformer from '#users/transformers/user_transformer'

export default class ImpersonationsController {
  /** Answers like login: the frontend swaps in the token and keeps the admin's to come back. */
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
