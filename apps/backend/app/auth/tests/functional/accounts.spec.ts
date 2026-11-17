import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import AuditEvent from '#core/models/audit_event';
import { account, sessionIdOf } from '#tests/accounts';
import { sessionOf } from '#tests/sessions';

/** A signup body with a concrete `locale`/`timezone`, for a value the typed route would reject. */
interface SignupBody {
  fullName: string | null;
  email: string;
  password: string;
  passwordConfirmation: string;
  locale?: string;
  timezone?: string;
}

test.group('Auth | accounts', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('rejects a signup whose email differs from an account only in case', async ({
    client,
  }) => {
    await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'Ada@Example.com' });

    const response = await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'ada@example.com' });

    response.assertStatus(422);
  });

  test('logs in with the email in any case', async ({ client }) => {
    await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'Ada@Example.com' });

    const response = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ADA@example.COM', password: account.password });

    response.assertStatus(200);
  });

  // Regression: a given locale/timezone is ignored, or an absent locale doesn't fall back to the
  // request's.
  test('stores the given locale and timezone, and falls back to the request locale', async ({
    client,
    assert,
  }) => {
    const chosen = await client.visit('auth.new_account.store').json({
      ...account,
      email: 'chose@example.com',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    });

    assert.containsSubset(chosen.body().data.user, {
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    });

    const fallback = await client
      .visit('auth.new_account.store')
      .header('accept-language', 'pt-BR')
      .json({ ...account, email: 'fallback@example.com' });

    assert.containsSubset(fallback.body().data.user, {
      locale: 'pt-BR',
      timezone: null,
    });
  });

  // Regression: an unsupported locale or an unrecognized timezone name is stored instead of
  // rejected.
  test('rejects an unsupported locale or an unrecognized timezone', async ({
    client,
  }) => {
    const badLocaleBody: SignupBody = {
      ...account,
      email: 'bad-locale@example.com',
      locale: 'fr-FR',
    };

    // SAFETY: the route only type-checks a supported locale/timezone; this body is intentionally
    // one the validator, not the type checker, must reject.
    const badLocale = await client
      .post('/api/v1/auth/signup')
      .json(badLocaleBody as never);

    badLocale.assertStatus(422);

    const badTimezoneBody: SignupBody = {
      ...account,
      email: 'bad-timezone@example.com',
      timezone: 'Mars/Olympus_Mons',
    };

    // SAFETY: same as above, for the timezone field.
    const badTimezone = await client
      .post('/api/v1/auth/signup')
      .json(badTimezoneBody as never);

    badTimezone.assertStatus(422);
  });

  // Regression: a name longer than the column passes validation and the insert answers 500.
  test('rejects a full name longer than 255 characters', async ({ client }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({
        ...account,
        email: 'long-name@example.com',
        fullName: 'x'.repeat(256),
      });

    response.assertStatus(422);
  });

  test('records the sign-up, attributed to the new account', async ({
    client,
    assert,
  }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'ada@example.com' });

    const userId = response.body().data.user.id;
    const event = await AuditEvent.findByOrFail('type', 'auth.signed_up');

    assert.deepInclude(event.toJSON(), {
      actorId: userId,
      subjectId: userId,
      tenantId: null,
      data: { email: 'ada@example.com', fullName: null },
    });
  });

  test('records a login and its logout under the session they open and close', async ({
    client,
    assert,
  }) => {
    await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'ada@example.com' });

    const login = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ada@example.com', password: account.password });

    const { token, user } = sessionOf(login.body().data);
    await client.visit('profile.access_tokens.destroy').bearerToken(token);

    const events = await AuditEvent.query()
      .whereIn('type', ['auth.logged_in', 'auth.logged_out'])
      .orderBy('id');

    assert.deepEqual(
      events.map((event) => [event.type, event.actorId, event.sessionId]),
      [
        ['auth.logged_in', user.id, sessionIdOf(token)],
        ['auth.logged_out', user.id, sessionIdOf(token)],
      ]
    );
  });

  test('records a failed login with the email tried, never the password', async ({
    client,
    assert,
  }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'nobody@example.com', password: 'guess-1234' });

    response.assertStatus(400);
    const event = await AuditEvent.findByOrFail('type', 'auth.login_failed');
    assert.deepInclude(event.toJSON(), {
      actorId: null,
      data: { email: 'nobody@example.com' },
    });
  });
});
