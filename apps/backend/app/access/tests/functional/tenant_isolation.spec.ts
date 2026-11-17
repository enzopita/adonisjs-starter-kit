import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import Role from '#access/models/role';
import { ownedWorkspace, workspace } from '#access/tests/seed';

async function setup() {
  const { acme, owner } = await ownedWorkspace();

  return { acme, globex: await workspace('Globex'), owner };
}

test.group('Access | tenant isolation', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('counts only the role and grants of the tenant in X-Tenant-Id', async ({
    client,
    assert,
  }) => {
    const { acme, globex } = await setup();
    const user = await acme.member();
    await globex.tenant.related('memberships').create({ userId: user.id });
    await globex.assign(user, await globex.role('Editor', ['roles.manage']));
    await globex.grant(user, 'members.manage');

    const response = await client
      .visit('access.my_permissions.show')
      .headers(acme.headers)
      .loginAs(user);

    assert.deepEqual(response.body().data.permissions, []);
  });

  test('answers 404 for a role of another tenant', async ({
    client,
    assert,
  }) => {
    const { acme, globex, owner } = await setup();
    const auditor = await globex.role('Auditor', []);

    const updated = await client
      .visit('access.roles.update', { id: auditor.id })
      .json({ name: 'Hijacked', permissions: ['roles.manage'] })
      .headers(acme.headers)
      .loginAs(owner);

    const deleted = await client
      .visit('access.roles.destroy', { id: auditor.id })
      .headers(acme.headers)
      .loginAs(owner);

    updated.assertStatus(404);
    deleted.assertStatus(404);

    const untouched = await globex.inside(() => Role.findOrFail(auditor.id));
    assert.deepEqual(untouched.permissions, []);
  });

  test('refuses a role of another tenant and a member of another tenant', async ({
    client,
  }) => {
    const { acme, globex, owner } = await setup();
    const target = await acme.member();
    const outsider = await globex.member();
    const auditor = await globex.role('Auditor', []);
    const viewer = await acme.role('Viewer', []);

    const foreignRole = await client
      .visit('access.member_roles.update', { userId: target.id })
      .json({ roleId: auditor.id })
      .headers(acme.headers)
      .loginAs(owner);

    const foreignMember = await client
      .visit('access.member_roles.update', { userId: outsider.id })
      .json({ roleId: viewer.id })
      .headers(acme.headers)
      .loginAs(owner);

    foreignRole.assertStatus(422);
    foreignMember.assertStatus(404);
  });

  test('takes a role name in one tenant only', async ({ client }) => {
    const { acme, globex, owner } = await setup();
    await globex.role('Editor', []);

    const editor = await client
      .visit('access.roles.store')
      .json({ name: 'Editor', permissions: [] })
      .headers(acme.headers)
      .loginAs(owner);

    editor.assertStatus(200);
  });
});
