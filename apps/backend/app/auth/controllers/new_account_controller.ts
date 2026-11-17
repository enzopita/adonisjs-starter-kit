import SignUp from '#auth/actions/sign_up'
import { signupValidator } from '#auth/validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#users/transformers/user_transformer'
import { releaseToken } from '#auth/services/sessions'

/**
 * @tags Auth
 */
export default class NewAccountController {
  /**
   * Create an account
   *
   * Returns the new user and an access token, so the caller is signed in right away. Mails a link
   * to verify the email address, valid for 24 hours. Without `locale`, the account takes the
   * request's Accept-Language locale.
   *
   * @response {429} Too many attempts; retry after the Retry-After header
   */
  async store({ i18n, request, serialize }: HttpContext) {
    const { locale, timezone, ...account } = await request.validateUsing(signupValidator)

    const { user, token } = await new SignUp().handle({
      ...account,
      locale: locale ?? i18n.locale,
      timezone: timezone ?? null,
      userAgent: request.header('user-agent'),
      ipAddress: request.ip(),
    })

    return serialize({
      user: UserTransformer.transform(user),
      token: releaseToken(token),
    })
  }
}
