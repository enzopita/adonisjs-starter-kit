import { setTimeout } from 'node:timers/promises';

import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { penalizeTwoFactorFailure } from '#start/limiter';
import { account } from '#tests/accounts';

test.group('Auth | throttling', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('blocks login after 5 failures for the same email, but another email from the same IP still works', async ({
    client,
    assert,
  }) => {
    await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'ada@example.com' });
    await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'eve@example.com' });

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await client
        .visit('auth.access_tokens.store')
        .json({ email: 'ada@example.com', password: 'wrong-password' });

      response.assertStatus(400);
    }

    const blocked = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ada@example.com', password: 'wrong-password' });

    blocked.assertStatus(429);
    blocked.assertHeader('retry-after');
    assert.deepEqual(blocked.body(), {
      code: 'E_TOO_MANY_REQUESTS',
      message: 'Too many attempts. Please wait a bit and try again.',
    });

    const otherEmail = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'eve@example.com', password: account.password });

    otherEmail.assertStatus(200);
  });

  test('a successful login resets the failure count for that email and IP', async ({
    client,
  }) => {
    await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'ada@example.com' });

    for (let attempt = 0; attempt < 4; attempt++) {
      await client
        .visit('auth.access_tokens.store')
        .json({ email: 'ada@example.com', password: 'wrong-password' });
    }

    const success = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ada@example.com', password: account.password });

    success.assertStatus(200);

    // Were the failure count not reset on success, this 5th failure in a row would be the 9th.
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await client
        .visit('auth.access_tokens.store')
        .json({ email: 'ada@example.com', password: 'wrong-password' });

      response.assertStatus(400);
    }
  });

  test('blocks signup past its per-IP limit', async ({ client }) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await client
        .visit('auth.new_account.store')
        .json({ ...account, email: `signup-${attempt}@example.com` });

      response.assertStatus(200);
    }

    const blocked = await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'signup-5@example.com' });

    blocked.assertStatus(429);
    blocked.assertHeader('retry-after');
  });

  test('blocks reset requests per email and IP, in any case, but another email from the same IP still works', async ({
    client,
  }) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await client
        .visit('auth.password_resets.store')
        .json({ email: attempt % 2 ? 'Ada@Example.com' : 'ada@example.com' });

      response.assertStatus(200);
    }

    const blocked = await client
      .visit('auth.password_resets.store')
      .json({ email: 'ada@example.com' });

    blocked.assertStatus(429);

    const otherEmail = await client
      .visit('auth.password_resets.store')
      .json({ email: 'eve@example.com' });

    otherEmail.assertStatus(200);
  });
});

test.group('Auth | failure budget', () => {
  test('concurrent checks never run more than the 5 the budget allows', async ({
    assert,
  }) => {
    let checked = 0;

    const attempts = Array.from({ length: 20 }, () =>
      penalizeTwoFactorFailure('budget-user', async () => {
        checked++;
        // A real check awaits the database, the window a racing request would slip through.
        await setTimeout(20);
        throw new Error('wrong code');
      })
    );

    await Promise.allSettled(attempts);

    assert.equal(checked, 5);
  });
});
