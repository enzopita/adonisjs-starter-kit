import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';

import {
  makePlatformAdmin,
  permissionsOf,
  workspace,
} from '#access/tests/seed';

test.group('Access | effective permissions', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('joins the permissions of the role and the grants', async ({
    client,
    assert,
  }) => {
    const acme = await workspace();
    const user = await acme.member();
    await acme.assign(user, await acme.role('Editor', ['roles.manage']));
    await acme.grant(user, 'members.manage');
    const plain = await acme.member();

    assert.deepEqual(await permissionsOf(client, user, acme.headers), [
      'roles.manage',
      'members.manage',
    ]);
    assert.deepEqual(await permissionsOf(client, plain, acme.headers), []);
  });

  test('ignores permissions the catalog no longer lists', async ({
    client,
    assert,
  }) => {
    const acme = await workspace();
    const user = await acme.member();
    await acme.assign(
      user,
      await acme.role('Legacy', ['reports.export', 'roles.manage'])
    );
    await acme.grant(user, 'invoices.void');

    assert.deepEqual(await permissionsOf(client, user, acme.headers), [
      'roles.manage',
    ]);
  });

  // Regression: a platform admin without two-factor gets every permission in a tenant where
  // they hold no role, or one with two-factor confirmed loses them.
  test('gives a platform admin every permission once two-factor is confirmed', async ({
    client,
    assert,
  }) => {
    const acme = await workspace();
    const admin = await acme.member();
    await makePlatformAdmin(admin);

    const members = () =>
      client.visit('access.members.index').headers(acme.headers).loginAs(admin);

    assert.deepEqual(await permissionsOf(client, admin, acme.headers), []);
    const denied = await members();
    denied.assertStatus(403);

    // The `access` module can't import the `auth` test helper; only the confirmation is read.
    admin.merge({
      twoFactorSecret: 'unused',
      twoFactorConfirmedAt: DateTime.now(),
    });
    await admin.save();

    assert.deepEqual(await permissionsOf(client, admin, acme.headers), [
      'roles.manage',
      'members.manage',
      'audit.view',
      'platform.admin',
    ]);
    const allowed = await members();
    allowed.assertStatus(200);
  });
});

test.group('Access | permission catalog', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('groups assignable permissions in catalog order, without platform.admin', async ({
    client,
    assert,
  }) => {
    const acme = await workspace();
    const member = await acme.member();

    const response = await client
      .visit('access.permission_catalog.show')
      .headers(acme.headers)
      .loginAs(member);

    response.assertStatus(200);
    assert.deepEqual(response.body().data.groups, [
      { key: 'roles', permissions: ['roles.manage'] },
      { key: 'members', permissions: ['members.manage'] },
      { key: 'audit', permissions: ['audit.view'] },
    ]);
  });
});
