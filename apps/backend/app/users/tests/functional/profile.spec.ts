import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import AuditEvent from '#core/models/audit_event';
import User from '#users/models/user';

/** A PATCH body with a concrete `locale`/`timezone`, for a value the typed route would reject. */
interface ProfileBody {
  locale?: string;
  timezone?: string;
}

test.group('Users | profile', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('updates one field and keeps the other', async ({ client, assert }) => {
    const user = await User.create({
      email: 'one@example.com',
      password: 'password123',
      locale: 'en-US',
      timezone: 'America/Sao_Paulo',
    });

    const response = await client
      .patch('/api/v1/account/profile')
      .json({ locale: 'pt-BR' })
      .loginAs(user);

    response.assertStatus(200);
    assert.containsSubset(response.body().data, {
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    });
  });

  test('updates both fields', async ({ client, assert }) => {
    const user = await User.create({
      email: 'both@example.com',
      password: 'password123',
    });

    const response = await client
      .patch('/api/v1/account/profile')
      .json({ locale: 'pt-BR', timezone: 'UTC' })
      .loginAs(user);

    response.assertStatus(200);
    assert.containsSubset(response.body().data, {
      locale: 'pt-BR',
      timezone: 'UTC',
    });
  });

  test('rejects an empty update, an unsupported locale or an unrecognized timezone', async ({
    client,
  }) => {
    const user = await User.create({
      email: 'invalid@example.com',
      password: 'password123',
    });

    const badLocaleBody: ProfileBody = { locale: 'fr-FR' };

    // SAFETY: the route only type-checks a supported locale/timezone; this body is intentionally
    // one the validator, not the type checker, must reject.
    const badLocale = await client
      .patch('/api/v1/account/profile')
      .json(badLocaleBody as never)
      .loginAs(user);

    badLocale.assertStatus(422);

    const badTimezoneBody: ProfileBody = { timezone: 'Mars/Olympus_Mons' };

    // SAFETY: same as above, for the timezone field.
    const badTimezone = await client
      .patch('/api/v1/account/profile')
      .json(badTimezoneBody as never)
      .loginAs(user);

    badTimezone.assertStatus(422);

    const empty = await client
      .patch('/api/v1/account/profile')
      .json({})
      .loginAs(user);

    empty.assertStatus(422);
  });

  test('records the change with the locale and timezone before and after', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: 'audit@example.com',
      password: 'password123',
      locale: 'en-US',
    });

    await client
      .patch('/api/v1/account/profile')
      .json({ locale: 'pt-BR' })
      .loginAs(user);

    const event = await AuditEvent.findByOrFail('type', 'user.profile_updated');
    assert.deepInclude(event.toJSON(), {
      actorId: user.id,
      subjectId: user.id,
      data: { changes: { locale: { from: 'en-US', to: 'pt-BR' } } },
    });
  });
});
