import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import i18nManager from '@adonisjs/i18n/services/main'
import { EXPIRY } from '#access/actions/invite_member'

export interface InvitationMailInput {
  email: string
  link: string
  locale: string
}

export default class InvitationMail extends BaseMail {
  constructor(private data: InvitationMailInput) {
    super()
  }

  prepare() {
    const i18n = i18nManager.locale(this.data.locale)
    const appName = env.get('APP_NAME')
    const subject = i18n.t('access.invitation_mail.subject')

    // Queued mails reach the worker as JSON, so the views get finished strings, not a bound t().
    const view = {
      link: this.data.link,
      lang: this.data.locale.split('-')[0],
      appName,
      subject,
      preview: i18n.t('access.invitation_mail.preview', { appName }),
      heading: i18n.t('access.invitation_mail.heading'),
      intro: i18n.t('access.invitation_mail.intro', { appName }),
      accept: i18n.t('access.invitation_mail.accept'),
      openLink: i18n.t('access.invitation_mail.open_link'),
      pasteLink: i18n.t('mail.paste_link'),
      expires: i18n.t('access.invitation_mail.expires', { days: EXPIRY.days }),
      footer: i18n.t('access.invitation_mail.footer'),
    }

    this.message
      .to(this.data.email)
      .subject(subject)
      .htmlView('emails/invitation_html', view)
      .textView('emails/invitation_text', view)
  }
}
