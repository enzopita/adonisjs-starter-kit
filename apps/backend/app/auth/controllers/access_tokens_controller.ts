import User from '#users/models/user'
import LogIn from '#auth/actions/log_in'
import { audit } from '#core/audit/main'
import type {} from '#auth/types/audit'
import { loginValidator } from '#auth/validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#users/transformers/user_transformer'
import { releaseToken } from '#auth/services/sessions'

export default class AccessTokensController {
  /**
   * Sign in with email and password
   *
   * Returns the user and an access token to send as a bearer token. When the account has two-factor
   * authentication on, it returns `twoFactorRequired: true` and a `challenge` instead: send it with
   * a code to `POST /auth/login/two-factor` within 5 minutes.
   *
   * Wrong passwords for one email from one IP are limited to 5 per 15 minutes, then blocked for 15
   * minutes.
   *
   * @tags Auth
   * @response {400} The email or password is wrong
   * @response {429} Too many attempts; retry after the Retry-After header
   */
  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const result = await new LogIn().handle({
      email,
      password,
      userAgent: request.header('user-agent'),
      ipAddress: request.ip(),
    })

    if (result.twoFactorRequired) return serialize(result)

    return serialize({
      twoFactorRequired: false as const,
      user: UserTransformer.transform(result.user),
      token: releaseToken(result.token),
    })
  }

  /**
   * Sign out of the current session
   *
   * Revokes the access token that made the request.
   *
   * @tags Sessions
   */
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
