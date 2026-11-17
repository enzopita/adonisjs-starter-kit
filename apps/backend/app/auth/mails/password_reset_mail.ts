import { USER_TOKEN_EXPIRY } from '#auth/services/user_tokens';
import { LinkMail } from '#core/mails/link_mail';

export default class PasswordResetMail extends LinkMail {
  protected prefix = 'auth.password_reset_mail';
  protected view = 'password_reset';
  protected expiresIn = { minutes: USER_TOKEN_EXPIRY.password_reset.minutes };
}
