import type { HttpContext } from '@adonisjs/core/http'
import VerifyEmail from '#auth/actions/verify_email'
import { verifyEmailValidator } from '#auth/validators/auth'
import ResendEmailVerification from '#auth/actions/resend_email_verification'

export default class EmailVerificationsController {
  /**
   * Resend the email verification link
   *
   * Mails a new link to the signed-in user, valid for 24 hours, and invalidates the previous one.
   * Does nothing when the email is already verified, and still answers with success.
   *
   * @tags Account
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async store({ auth, i18n, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    await new ResendEmailVerification().handle({ user, locale: i18n.locale })

    return serialize({ message: i18n.t('auth.email_verification_requested') })
  }

  /**
   * Verify an email address
   *
   * Takes the token from the emailed verification link. Each token works once.
   *
   * @tags Auth
   * @throws {import('#auth/exceptions/invalid_verification_token_exception').default} The token is invalid, expired, or already used
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async update({ i18n, request, serialize }: HttpContext) {
    const { token } = await request.validateUsing(verifyEmailValidator)

    await new VerifyEmail().handle({ token })

    return serialize({ message: i18n.t('auth.email_verified') })
  }
}
