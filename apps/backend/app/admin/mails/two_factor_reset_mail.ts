import { USER_TOKEN_EXPIRY } from '#auth/services/user_tokens';
import { LinkMail } from '#core/mails/link_mail';

export default class TwoFactorResetMail extends LinkMail {
  protected prefix = 'admin.two_factor_reset_mail';
  protected view = 'two_factor_reset';
  protected expiresIn = { minutes: USER_TOKEN_EXPIRY.password_reset.minutes };
  protected override extraKeys = ['warning'];
}
