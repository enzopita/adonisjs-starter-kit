import { USER_TOKEN_EXPIRY } from '#auth/services/user_tokens';
import { LinkMail } from '#core/mails/link_mail';

export default class EmailVerificationMail extends LinkMail {
  protected prefix = 'auth.email_verification_mail';
  protected view = 'email_verification';
  protected expiresIn = { hours: USER_TOKEN_EXPIRY.email_verification.hours };
}
