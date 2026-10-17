import User from '#users/models/user'
import { audit } from '#core/audit/main'
import type {} from '#auth/types/audit'
import { loginValidator } from '#auth/validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#users/transformers/user_transformer'

export default class AccessTokensController {
  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    let user: User

    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      const owner = await User.findBy('email', email)

      await audit.note('auth.login_failed', {
        tenantId: null,
        subject: owner ? { type: 'user', id: owner.id } : null,
        data: { email },
      })

      throw error
    }

    const token = await User.accessTokens.create(user)

    await audit.note('auth.logged_in', {
      tenantId: null,
      subject: { type: 'user', id: user.id },
      actorId: user.id,
      sessionId: String(token.identifier),
      data: { email: user.email },
    })

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  async destroy({ auth, i18n, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    await audit.note('auth.logged_out', {
      tenantId: null,
      subject: { type: 'user', id: user.id },
      data: { email: user.email },
    })

    return serialize({
      message: i18n.t('auth.logged_out'),
    })
  }
}
