import { test } from '@japa/runner'
import type User from '#users/models/user'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { makePlatformAdmin, workspace } from '#access/tests/seed'

async function permissionsOf(client: ApiClient, user: User, headers: Record<string, string>) {
  const response = await client.visit('access.my_permissions.show').headers(headers).loginAs(user)

  response.assertStatus(200)

  return response.body().data.permissions
}

test.group('Access | effective permissions', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('joins the permissions of the role and the grants', async ({ client, assert }) => {
    const acme = await workspace()
    const user = await acme.member()
    await acme.assign(user, await acme.role('Editor', ['roles.manage']))
    await acme.grant(user, 'members.manage')
    const plain = await acme.member()

    assert.deepEqual(await permissionsOf(client, user, acme.headers), [
      'roles.manage',
      'members.manage',
    ])
    assert.deepEqual(await permissionsOf(client, plain, acme.headers), [])
  })

  test('ignores permissions the catalog no longer lists', async ({ client, assert }) => {
    const acme = await workspace()
    const user = await acme.member()
    await acme.assign(user, await acme.role('Legacy', ['reports.export', 'roles.manage']))
    await acme.grant(user, 'invoices.void')

    assert.deepEqual(await permissionsOf(client, user, acme.headers), ['roles.manage'])
  })

  test('gives a platform admin every permission', async ({ client, assert }) => {
    const acme = await workspace()
    const admin = await acme.member()
    await makePlatformAdmin(admin)

    assert.deepEqual(await permissionsOf(client, admin, acme.headers), [
      'roles.manage',
      'members.manage',
      'audit.view',
      'platform.admin',
    ])
  })
})

test.group('Access | permission catalog', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('groups assignable permissions in catalog order, without platform.admin', async ({
    client,
    assert,
  }) => {
    const acme = await workspace()
    const member = await acme.member()

    const response = await client
      .visit('access.permission_catalog.show')
      .headers(acme.headers)
      .loginAs(member)

    response.assertStatus(200)
    assert.deepEqual(response.body().data.groups, [
      { key: 'roles', permissions: ['roles.manage'] },
      { key: 'members', permissions: ['members.manage'] },
      { key: 'audit', permissions: ['audit.view'] },
    ])
  })
})
