import type mail from '@adonisjs/mail/services/main';

/** Pulls the raw token out of the `/<path>/:token` link in the most recently queued mail. */
export function linkToken(fake: ReturnType<typeof mail.fake>, path: string) {
  const queued = fake.mails.queued();
  const html = queued.at(-1)?.message.toJSON().message.html;

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- nodemailer types html as its input union (string, Buffer, stream, attachment); a rendered htmlView() is the string.
  const rendered = typeof html === 'string' ? html : '';

  const token = new RegExp(`href="[^"]*/${path}/([a-f0-9]+)"`, 'u').exec(
    rendered
  )?.[1];

  if (token === undefined) {
    throw new Error(`No /${path}/ link found in the last queued mail`);
  }

  return token;
}
