import type { HttpContext } from '@adonisjs/core/http';

import ResendEmailVerification from '#auth/actions/resend_email_verification';
import VerifyEmail from '#auth/actions/verify_email';
import { verifyEmailValidator } from '#auth/validators/auth';

export default class EmailVerificationsController {
  /**
   * Resend the email verification link
   *
   * Mails a new link to the signed-in user, valid for 24 hours, and invalidates the previous one.
   * Does nothing when the email is already verified, and still answers with success.
   *
   * @tags Account
   * @response {429} Too many attempts; retry after the Retry-After header
   */
  async store({ auth, i18n, serialize }: HttpContext) {
    const user = auth.getUserOrFail();

    await new ResendEmailVerification().handle({ user, locale: i18n.locale });

    return await serialize({
      message: i18n.t('auth.email_verification_requested'),
    });
  }

  /**
   * Verify an email address
   *
   * Takes the token from the emailed verification link. Each token works once.
   *
   * @tags Auth
   * @response {429} Too many attempts; retry after the Retry-After header
   */
  async update({ i18n, request, serialize }: HttpContext) {
    const { token } = await request.validateUsing(verifyEmailValidator);

    await new VerifyEmail().handle({ token });

    return await serialize({ message: i18n.t('auth.email_verified') });
  }
}
