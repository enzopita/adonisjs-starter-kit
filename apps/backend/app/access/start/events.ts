import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import emitter from '@adonisjs/core/services/emitter'
import InvitationMail from '#access/mails/invitation_mail'
import SeedTenantOwner from '#access/actions/seed_tenant_owner'

emitter.on('tenancy:tenant_created', event => new SeedTenantOwner().handle(event))

emitter.on('access:member_invited', ({ email, token, locale }) => {
  const link = `${env.get('FRONTEND_URL')}/invitations/${token}`

  return mail.sendLater(new InvitationMail({ email, link, locale }))
})
