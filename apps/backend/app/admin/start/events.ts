import emitter from '@adonisjs/core/services/emitter';
import mail from '@adonisjs/mail/services/main';

import TwoFactorResetMail from '#admin/mails/two_factor_reset_mail';
import env from '#start/env';

emitter.on('admin:two_factor_reset', ({ email, token, locale }) => {
  const link = `${env.get('FRONTEND_URL')}/reset-password/${token}`;

  return mail.sendLater(new TwoFactorResetMail({ email, link, locale }));
});
