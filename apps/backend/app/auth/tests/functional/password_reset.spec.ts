import testUtils from '@adonisjs/core/services/test_utils';
import db from '@adonisjs/lucid/services/db';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';

import PasswordResetMail from '#auth/mails/password_reset_mail';
import { account, signUp } from '#tests/accounts';
import { linkToken } from '#tests/mails';
import { sessionOf } from '#tests/sessions';

const newPassword = {
  password: 'new-password456',
  passwordConfirmation: 'new-password456',
};

test.group('Auth | password reset', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('answers the same for an unknown email, and mails only an existing account', async ({
    client,
    assert,
  }) => {
    await signUp(client, 'ada@example.com');
    using fake = mail.fake();

    const known = await client
      .visit('auth.password_resets.store')
      .json({ email: 'Ada@example.com' });

    const unknown = await client
      .visit('auth.password_resets.store')
      .json({ email: 'nobody@example.com' });

    known.assertStatus(200);
    unknown.assertStatus(200);
    assert.deepEqual(unknown.body(), known.body());

    fake.mails.assertQueuedCount(PasswordResetMail, 1);
    fake.mails.assertQueued(PasswordResetMail, ({ message }) =>
      message.hasTo('ada@example.com')
    );
  });

  // Regression: the mail follows the requester's Accept-Language instead of the recipient's own
  // stored locale.
  test('mails a pt-BR user in pt-BR even on a request with an en-US Accept-Language', async ({
    client,
    assert,
  }) => {
    await signUp(client, 'ada@example.com');
    await db
      .from('users')
      .where('email', 'ada@example.com')
      .update({ locale: 'pt-BR' });
    using fake = mail.fake();

    await client
      .visit('auth.password_resets.store')
      .header('accept-language', 'en-US')
      .json({ email: 'ada@example.com' });

    const queued = fake.mails.queued();
    assert.equal(
      queued[0]?.message.toJSON().message.subject,
      'Redefina sua senha'
    );
  });

  test('mails nothing for a disabled account', async ({ client }) => {
    await signUp(client, 'ada@example.com');
    await db
      .from('users')
      .where('email', 'ada@example.com')
      .update({ disabled_at: new Date() });
    using fake = mail.fake();

    const response = await client
      .visit('auth.password_resets.store')
      .json({ email: 'ada@example.com' });

    response.assertStatus(200);
    fake.mails.assertNoneQueued();
  });

  test('resets once with the mailed token, signs out every session, and verifies the email', async ({
    client,
    assert,
  }) => {
    const signupSession = await signUp(client, 'ada@example.com');

    const signIn = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ada@example.com', password: account.password });

    const { token: loginSession } = sessionOf(signIn.body().data);

    using fake = mail.fake();
    await client
      .visit('auth.password_resets.store')
      .json({ email: 'ada@example.com' });
    const token = linkToken(fake, 'reset-password');

    const reset = await client
      .visit('auth.password_resets.update')
      .json({ token, ...newPassword });

    reset.assertStatus(200);
    assert.notProperty(reset.body().data, 'token');

    for (const session of [signupSession, loginSession]) {
      const response = await client
        .visit('profile.profile.show')
        .bearerToken(session);

      response.assertStatus(401);
    }

    const oldPassword = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ada@example.com', password: account.password });

    oldPassword.assertStatus(400);

    const login = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ada@example.com', password: newPassword.password });

    login.assertStatus(200);
    assert.isNotNull(sessionOf(login.body().data).user.emailVerifiedAt);

    const reused = await client.visit('auth.password_resets.update').json({
      token,
      password: 'third-password',
      passwordConfirmation: 'third-password',
    });

    reused.assertStatus(400);
    reused.assertBodyContains({ code: 'E_INVALID_RESET_TOKEN' });
  });

  test('refuses an expired token', async ({ client }) => {
    await signUp(client, 'ada@example.com');
    using fake = mail.fake();
    await client
      .visit('auth.password_resets.store')
      .json({ email: 'ada@example.com' });
    const token = linkToken(fake, 'reset-password');

    await db
      .from('user_tokens')
      .update({ expires_at: new Date(Date.now() - 1000) });

    const response = await client
      .visit('auth.password_resets.update')
      .json({ token, ...newPassword });

    response.assertStatus(400);
    response.assertBodyContains({ code: 'E_INVALID_RESET_TOKEN' });
  });

  test('refuses a disabled account', async ({ client }) => {
    await signUp(client, 'ada@example.com');
    using fake = mail.fake();
    await client
      .visit('auth.password_resets.store')
      .json({ email: 'ada@example.com' });
    const token = linkToken(fake, 'reset-password');
    await db
      .from('users')
      .where('email', 'ada@example.com')
      .update({ disabled_at: new Date() });

    const response = await client
      .visit('auth.password_resets.update')
      .json({ token, ...newPassword });

    response.assertStatus(403);
    response.assertBodyContains({ code: 'E_ACCOUNT_DISABLED' });
  });
});
