import type mail from '@adonisjs/mail/services/main';

/** Pulls the raw token out of the `/<path>/:token` link in the most recently queued mail. */
export function linkToken(fake: ReturnType<typeof mail.fake>, path: string) {
  const queued = fake.mails.queued();
  const html = queued[queued.length - 1]?.message.toJSON().message.html;

  // SAFETY: every mail only ever calls message.htmlView(), which renders to a string.
  const token = (html as string | undefined)?.match(
    new RegExp(`href="[^"]*/${path}/([a-f0-9]+)"`)
  )?.[1];

  if (!token)
    throw new Error(`No /${path}/ link found in the last queued mail`);

  return token;
}
