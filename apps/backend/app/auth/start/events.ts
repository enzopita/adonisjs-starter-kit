import emitter from '@adonisjs/core/services/emitter';
import mail from '@adonisjs/mail/services/main';

import EmailVerificationMail from '#auth/mails/email_verification_mail';
import PasswordResetMail from '#auth/mails/password_reset_mail';
import env from '#start/env';

emitter.on('auth:password_reset_requested', ({ email, token, locale }) => {
  const link = `${env.get('FRONTEND_URL')}/reset-password/${token}`;

  return mail.sendLater(new PasswordResetMail({ email, link, locale }));
});

emitter.on('auth:email_verification_requested', ({ email, token, locale }) => {
  const link = `${env.get('FRONTEND_URL')}/verify-email/${token}`;

  return mail.sendLater(new EmailVerificationMail({ email, link, locale }));
});
