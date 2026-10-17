import { Job } from '@adonisjs/queue'
import mail from '@adonisjs/mail/services/main'
import type { JobOptions } from '@adonisjs/queue/types'
import type { MailersList, MessageBodyTemplates, NodeMailerMessage } from '@adonisjs/mail/types'

interface SendMailPayload {
  mailerName: keyof MailersList
  message: NodeMailerMessage
  views: MessageBodyTemplates
}

export default class SendMailJob extends Job<SendMailPayload> {
  static override options: JobOptions = {
    maxRetries: 5,
    timeout: '30s',
  }

  async execute() {
    const { mailerName, message, views } = this.payload

    await mail.use(mailerName).sendCompiled({ message, views })
  }
}
