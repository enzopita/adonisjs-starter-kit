import { defineConfig, transports } from '@adonisjs/mail';

import env from '#start/env';

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER'),

  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },

  mailers: {
    /**
     * Points at mailpit (compose.yaml) in development.
     */
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      // Below SendMailJob's 30s timeout: nodemailer's default 10-minute socket timeout let a
      // server that stopped answering hold the job, and the worker's shutdown, indefinitely.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    }),
  },
});

export default mailConfig;

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
