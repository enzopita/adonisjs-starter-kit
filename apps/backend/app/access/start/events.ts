import emitter from '@adonisjs/core/services/emitter';
import mail from '@adonisjs/mail/services/main';

import SeedTenantOwner from '#access/actions/seed_tenant_owner';
import InvitationMail from '#access/mails/invitation_mail';
import env from '#start/env';

emitter.on('tenancy:tenant_created', (event) =>
  new SeedTenantOwner().handle(event)
);

emitter.on('access:member_invited', ({ email, token, locale }) => {
  const link = `${env.get('FRONTEND_URL')}/invitations/${token}`;

  return mail.sendLater(new InvitationMail({ email, link, locale }));
});
