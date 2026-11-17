import testUtils from '@adonisjs/core/services/test_utils';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';

import PruneExpiredTokens from '#auth/actions/prune_expired_tokens';
import AuditEvent from '#core/models/audit_event';
import { sessionIdOf, signUp } from '#tests/accounts';

test.group('Auth | prune tokens', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  // Regression: an idle access token, or an unused emailed one, stays in the tables forever
  // instead of being deleted once past its own expiry.
  test('deletes expired rows from both tables and keeps the live ones', async ({
    client,
    assert,
  }) => {
    const expiredToken = await signUp(client, 'ada@example.com');
    const liveToken = await signUp(client, 'grace@example.com');
    await db
      .from('auth_access_tokens')
      .where('id', sessionIdOf(expiredToken))
      .update({ expires_at: new Date(Date.now() - 1000) });

    const ada = await db
      .query<{ id: string }>()
      .from('users')
      .where('email', 'ada@example.com')
      .firstOrFail();

    await db.table('user_tokens').insert({
      user_id: ada.id,
      purpose: 'password_reset',
      token_hash: 'expired-hash',
      expires_at: new Date(Date.now() - 1000),
      created_at: new Date(),
    });

    const { accessTokens, userTokens } =
      await new PruneExpiredTokens().handle();

    assert.equal(accessTokens, 1);
    assert.equal(userTokens, 1);
    assert.isNull(
      await db
        .from('auth_access_tokens')
        .where('id', sessionIdOf(expiredToken))
        .first()
    );
    assert.isNull(
      await db.from('user_tokens').where('token_hash', 'expired-hash').first()
    );
    assert.isNotNull(
      await db
        .from('auth_access_tokens')
        .where('id', sessionIdOf(liveToken))
        .first()
    );
  });

  // Regression: a run leaves no trace of what it deleted, or a run that deletes nothing (a
  // second run, a concurrent one) adds an event anyway.
  test('records one system event for a run that deletes, none for one that doesn’t', async ({
    client,
    assert,
  }) => {
    const token = await signUp(client, 'ada@example.com');
    await db
      .from('auth_access_tokens')
      .where('id', sessionIdOf(token))
      .update({ expires_at: new Date(Date.now() - 1000) });

    await new PruneExpiredTokens().handle();
    await new PruneExpiredTokens().handle();

    const pruned = await AuditEvent.query().where('type', 'auth.tokens_pruned');
    assert.lengthOf(pruned, 1);
    assert.deepInclude(pruned[0]?.toJSON(), {
      tenantId: null,
      actorId: null,
      subjectId: null,
    });
    assert.deepEqual(pruned[0]?.data, { accessTokens: 1, userTokens: 0 });
  });
});
