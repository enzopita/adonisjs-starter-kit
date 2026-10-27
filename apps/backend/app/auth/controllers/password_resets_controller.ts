import type { HttpContext } from '@adonisjs/core/http'
import ResetPassword from '#auth/actions/reset_password'
import RevokeSessions from '#auth/actions/revoke_sessions'
import RequestPasswordReset from '#auth/actions/request_password_reset'
import { forgotPasswordValidator, resetPasswordValidator } from '#auth/validators/auth'

/**
 * @tags Auth
 */
export default class PasswordResetsController {
  /**
   * Request a password reset link
   *
   * Mails a reset link when the email belongs to an enabled account. The answer is the same either
   * way, so it does not tell whether an account exists. The link expires after 1 hour, and a new
   * request replaces it.
   *
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async store({ i18n, request, serialize }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    await new RequestPasswordReset().handle({ email, locale: i18n.locale })

    return serialize({ message: i18n.t('auth.password_reset_requested') })
  }

  /**
   * Reset the password with an emailed token
   *
   * Takes the token from the emailed reset link. Each token works once. Signs the user out of every
   * session, so they sign in again with the new password. Also marks the email as verified.
   *
   * @throws {import('#auth/exceptions/invalid_reset_token_exception').default} The token is invalid, expired, or already used
   * @throws {import('#auth/exceptions/account_disabled_exception').default} The account is disabled
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async update({ i18n, request, serialize }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const user = await new ResetPassword().handle({ token, password })

    // Whoever knew the old password is signed out everywhere, including the one resetting it.
    await new RevokeSessions().handle({ user })

    return serialize({ message: i18n.t('auth.password_reset') })
  }
}
