import testUtils from '@adonisjs/core/services/test_utils';
import type { ApiClient } from '@japa/api-client';
import { test } from '@japa/runner';

import { createUser, makePlatformAdmin, workspace } from '#access/tests/seed';
import { admin } from '#admin/tests/seed';
import { enableTwoFactor } from '#auth/tests/two_factor';
import AuditEvent from '#core/models/audit_event';
import type User from '#users/models/user';

function enter(client: ApiClient, user: User, tenantId: string) {
  return client
    .visit('access.my_permissions.show')
    .header('X-Tenant-Id', tenantId)
    .loginAs(user);
}

/** Every admin route but `admin/me`, against a tenant and a user to act on. */
function everyAdminRoute(client: ApiClient, tenantId: string, userId: string) {
  const tenant = { id: tenantId };
  const user = { id: userId };

  return [
    client.visit('admin.tenants.index'),
    client.visit('admin.tenants.show', tenant),
    client.visit('admin.tenants.update', tenant).json({ name: 'Taken' }),
    client.visit('admin.tenant_suspensions.store', tenant),
    client.visit('admin.tenant_suspensions.destroy', tenant),
    client.visit('admin.users.index'),
    client.visit('admin.user_suspensions.store', user),
    client.visit('admin.user_suspensions.destroy', user),
    client.visit('admin.impersonations.store', user),
    client.visit('admin.two_factor_resets.destroy', user),
    client.visit('admin.platform_admins.store', user),
    client.visit('admin.platform_admins.destroy', user),
  ];
}

test.group('Admin | tenants', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  // Regression: an admin route forgets authorize(), or admin/me tells a member they're an admin.
  test('denies every admin route to anyone but a platform admin', async ({
    client,
    assert,
  }) => {
    const acme = await workspace();
    const owner = await acme.member();
    await acme.assign(
      owner,
      await acme.role('Owner', ['roles.manage', 'members.manage'])
    );
    const target = await acme.member();
    const requests = everyAdminRoute(client, acme.tenant.id, target.id);

    const statuses = [];

    for (const request of requests) {
      const response = await request.headers(acme.headers).loginAs(owner);

      statuses.push(response.status());
    }

    assert.deepEqual(
      statuses,
      requests.map(() => 403)
    );

    const member = await client.visit('admin.me.show').loginAs(owner);

    const platformAdmin = await client
      .visit('admin.me.show')
      .loginAs(await admin());

    member.assertBody({
      data: { platformAdmin: false, twoFactorRequired: false },
    });
    platformAdmin.assertBody({
      data: { platformAdmin: true, twoFactorRequired: false },
    });
  });

  // Regression: an admin route, impersonation included, serves a platform admin without
  // two-factor, or admin/me can't tell them apart from a non-admin.
  test('refuses every admin route to a platform admin until they enable two-factor', async ({
    client,
  }) => {
    const acme = await workspace();
    const target = await acme.member();
    const viewer = await createUser();
    await makePlatformAdmin(viewer);

    for (const request of everyAdminRoute(client, acme.tenant.id, target.id)) {
      const response = await request.loginAs(viewer);

      response.assertStatus(403);
      response.assertBodyContains({ code: 'E_TWO_FACTOR_REQUIRED' });
    }

    const me = await client.visit('admin.me.show').loginAs(viewer);
    me.assertBody({ data: { platformAdmin: true, twoFactorRequired: true } });

    await enableTwoFactor(viewer);

    const users = await client.visit('admin.users.index').loginAs(viewer);
    users.assertStatus(200);

    const impersonation = await client
      .visit('admin.impersonations.store', { id: target.id })
      .loginAs(viewer);

    impersonation.assertStatus(200);
  });

  // Regression: the search, the order or the member counts are wrong, or pages overlap.
  test('lists tenants by name with their member count, searched and paginated', async ({
    client,
    assert,
  }) => {
    const viewer = await admin();
    const beta = await workspace('Beta Corp');
    await beta.member();
    await beta.member();
    await workspace('Acme Corp');
    await workspace('Gamma');

    const first = await client
      .visit('admin.tenants.index')
      .qs({ search: 'corp', perPage: 1 })
      .loginAs(viewer);

    const second = await client
      .visit('admin.tenants.index')
      .qs({ search: 'CORP', perPage: 1, page: 2 })
      .loginAs(viewer);

    first.assertStatus(200);
    assert.containSubset(first.body(), {
      data: [{ name: 'Acme Corp', memberCount: 0, suspendedAt: null }],
      metadata: { total: 2 },
    });
    assert.containSubset(second.body().data, [
      { name: 'Beta Corp', memberCount: 2 },
    ]);
  });

  // Regression: the detail leaks another tenant's members or roles, or mislabels an admin.
  test('shows a tenant with its members, their role and status', async ({
    client,
    assert,
  }) => {
    const viewer = await admin();
    const acme = await workspace();
    const owner = await acme.member();
    await acme.assign(owner, await acme.role('Owner', ['members.manage']));
    const staff = await acme.member();
    await makePlatformAdmin(staff);

    const other = await workspace('Other');
    const outsider = await other.member();
    await other.assign(outsider, await other.role('Owner', []));

    const response = await client
      .visit('admin.tenants.show', { id: acme.tenant.id })
      .loginAs(viewer);

    const unknown = await client
      .visit('admin.tenants.show', {
        id: '01900000-0000-7000-8000-000000000000',
      })
      .loginAs(viewer);

    response.assertStatus(200);
    assert.equal(response.body().data.tenant.name, 'Acme');
    assert.sameDeepMembers(
      response
        .body()
        .data.members.map(
          (member: { user: { email: string }; role: string | null }) => [
            member.user.email,
            member.role,
          ]
        ),
      [
        [owner.email, 'Owner'],
        [staff.email, null],
      ]
    );
    assert.containSubset(response.body().data.members, [
      { user: { id: staff.id }, platformAdmin: true, disabledAt: null },
      { user: { id: owner.id }, platformAdmin: false },
    ]);
    unknown.assertStatus(404);
  });

  // Regression: a rename skips the tenant's trail, or accepts a blank name.
  test('renames a tenant and records it on the tenant’s trail', async ({
    client,
    assert,
  }) => {
    const viewer = await admin();
    const acme = await workspace();

    const blank = await client
      .visit('admin.tenants.update', { id: acme.tenant.id })
      .json({ name: '  ' })
      .loginAs(viewer);

    const renamed = await client
      .visit('admin.tenants.update', { id: acme.tenant.id })
      .json({ name: 'Acme Inc' })
      .loginAs(viewer);

    blank.assertStatus(422);
    renamed.assertStatus(200);
    renamed.assertBodyContains({ data: { name: 'Acme Inc' } });

    const event = await AuditEvent.findByOrFail('type', 'admin.tenant_renamed');
    assert.deepEqual(
      [event.tenantId, event.actorId, event.subjectId, event.data],
      [
        acme.tenant.id,
        viewer.id,
        acme.tenant.id,
        { from: 'Acme', to: 'Acme Inc' },
      ]
    );
  });

  // Regression: a member keeps working in a suspended tenant, a non-member learns it exists and
  // is suspended, a repeated suspension moves its date, or the member's tenant list drops it.
  test('suspending locks the members out until the tenant is reactivated', async ({
    client,
    assert,
  }) => {
    const viewer = await admin();
    const acme = await workspace();
    const member = await acme.member();
    const outsider = await createUser();

    const suspended = await client
      .visit('admin.tenant_suspensions.store', { id: acme.tenant.id })
      .loginAs(viewer);

    const again = await client
      .visit('admin.tenant_suspensions.store', { id: acme.tenant.id })
      .loginAs(viewer);

    suspended.assertStatus(200);
    assert.isNotNull(suspended.body().data.suspendedAt);
    assert.equal(
      again.body().data.suspendedAt,
      suspended.body().data.suspendedAt
    );

    const locked = await enter(client, member, acme.tenant.id);
    locked.assertStatus(403);
    locked.assertBodyContains({ code: 'E_TENANT_SUSPENDED' });

    const foreign = await enter(client, outsider, acme.tenant.id);
    foreign.assertBodyContains({ code: 'E_TENANT_ACCESS_DENIED' });

    const listed = await client.visit('tenants.tenants.index').loginAs(member);
    assert.containSubset(listed.body().data, [
      { id: acme.tenant.id, suspendedAt: suspended.body().data.suspendedAt },
    ]);

    const reactivated = await client
      .visit('admin.tenant_suspensions.destroy', { id: acme.tenant.id })
      .loginAs(viewer);

    const back = await enter(client, member, acme.tenant.id);

    reactivated.assertBodyContains({ data: { suspendedAt: null } });
    back.assertStatus(200);

    const events = await AuditEvent.query()
      .where('tenant_id', acme.tenant.id)
      .whereLike('type', 'admin.%')
      .orderBy('id');

    assert.deepEqual(
      events.map((event) => [event.type, event.actorId, event.data]),
      [
        ['admin.tenant_suspended', viewer.id, { name: 'Acme' }],
        ['admin.tenant_suspended', viewer.id, { name: 'Acme' }],
        ['admin.tenant_reactivated', viewer.id, { name: 'Acme' }],
      ]
    );
  });
});
