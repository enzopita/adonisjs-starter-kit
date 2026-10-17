import mail from '@adonisjs/mail/services/main'
import SendMailJob from '#core/jobs/send_mail'
import type { MailersList } from '@adonisjs/mail/types'

mail.setMessenger(mailer => ({
  async queue({ message, views }) {
    // SAFETY: the messenger only receives mailers built from config/mail.ts, named by MailersList.
    const mailerName = mailer.name as keyof MailersList

    await SendMailJob.dispatch({ mailerName, message, views })
  },
}))
