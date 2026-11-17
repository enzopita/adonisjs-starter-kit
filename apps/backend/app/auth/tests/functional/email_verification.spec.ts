import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';

import EmailVerificationMail from '#auth/mails/email_verification_mail';
import { signUp } from '#tests/accounts';
import { linkToken } from '#tests/mails';

test.group('Auth | email verification', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('signup mails a link that verifies the email, without signing in', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake();
    const session = await signUp(client, 'ada@example.com');

    fake.mails.assertQueued(EmailVerificationMail, ({ message }) =>
      message.hasTo('ada@example.com')
    );

    const before = await client
      .visit('profile.profile.show')
      .bearerToken(session);
    assert.isNull(before.body().data.emailVerifiedAt);

    const verified = await client
      .visit('auth.email_verifications.update')
      .json({ token: linkToken(fake, 'verify-email') });

    verified.assertStatus(200);

    const after = await client
      .visit('profile.profile.show')
      .bearerToken(session);
    assert.isNotNull(after.body().data.emailVerifiedAt);
  });

  test('refuses an unknown token', async ({ client }) => {
    const response = await client
      .visit('auth.email_verifications.update')
      .json({ token: 'a'.repeat(64) });

    response.assertStatus(400);
    response.assertBodyContains({ code: 'E_INVALID_VERIFICATION_TOKEN' });
  });

  test('resending mails a new link and voids the previous one', async ({
    client,
  }) => {
    using fake = mail.fake();
    const session = await signUp(client, 'ada@example.com');
    const first = linkToken(fake, 'verify-email');

    const resent = await client
      .visit('profile.email_verifications.store')
      .bearerToken(session);
    resent.assertStatus(200);
    fake.mails.assertQueuedCount(EmailVerificationMail, 2);
    const second = linkToken(fake, 'verify-email');

    const stale = await client
      .visit('auth.email_verifications.update')
      .json({ token: first });
    stale.assertStatus(400);

    const fresh = await client
      .visit('auth.email_verifications.update')
      .json({ token: second });
    fresh.assertStatus(200);
  });

  test('resending once verified mails nothing', async ({ client }) => {
    using fake = mail.fake();
    const session = await signUp(client, 'ada@example.com');
    await client
      .visit('auth.email_verifications.update')
      .json({ token: linkToken(fake, 'verify-email') });

    const resent = await client
      .visit('profile.email_verifications.store')
      .bearerToken(session);

    resent.assertStatus(200);
    fake.mails.assertQueuedCount(EmailVerificationMail, 1);
  });
});
