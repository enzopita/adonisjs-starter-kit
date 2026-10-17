import { test } from '@japa/runner'
import type User from '#users/models/user'
import type { ApiClient } from '@japa/api-client'
import { workspace } from '#access/tests/seed'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'

type Workspace = Awaited<ReturnType<typeof workspace>>

async function setup() {
  const acme = await workspace()
  const owner = await acme.member()
  await acme.assign(owner, await acme.role('Owner', ['roles.manage', 'members.manage']))

  return { acme, owner }
}

function setRole(
  client: ApiClient,
  space: Workspace,
  actor: User,
  userId: string,
  roleId: string | null,
) {
  return client
    .visit('access.member_roles.update', { userId })
    .json({ roleId })
    .headers(space.headers)
    .loginAs(actor)
}

function setGrants(
  client: ApiClient,
  space: Workspace,
  actor: User,
  userId: string,
  permissions: ('roles.manage' | 'members.manage')[],
) {
  return client
    .visit('access.member_permissions.update', { userId })
    .json({ permissions })
    .headers(space.headers)
    .loginAs(actor)
}

async function permissionsOf(client: ApiClient, space: Workspace, user: User) {
  const response = await client
    .visit('access.my_permissions.show')
    .headers(space.headers)
    .loginAs(user)

  return response.body().data.permissions
}

test.group('Access | members', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('requires members.manage', async ({ client }) => {
    const { acme } = await setup()
    const roleManager = await acme.member()
    await acme.grant(roleManager, 'roles.manage')
    const target = await acme.member()

    const roleResponse = await setRole(client, acme, roleManager, target.id, null)
    const grantsResponse = await setGrants(client, acme, roleManager, target.id, [])

    roleResponse.assertStatus(403)
    grantsResponse.assertStatus(403)
  })

  test('replaces the role and the grants of a member', async ({ client, assert }) => {
    const { acme, owner } = await setup()
    const target = await acme.member()
    const editor = await acme.role('Editor', ['roles.manage'])
    const viewer = await acme.role('Viewer', [])

    await setRole(client, acme, owner, target.id, editor.id)
    assert.deepEqual(await permissionsOf(client, acme, target), ['roles.manage'])

    await setRole(client, acme, owner, target.id, viewer.id)
    await setGrants(client, acme, owner, target.id, ['roles.manage'])
    await setGrants(client, acme, owner, target.id, ['members.manage'])
    assert.deepEqual(await permissionsOf(client, acme, target), ['members.manage'])

    await setRole(client, acme, owner, target.id, null)
    await setGrants(client, acme, owner, target.id, [])
    assert.deepEqual(await permissionsOf(client, acme, target), [])
  })

  test('answers 404 for someone who is not a member', async ({ client }) => {
    const { acme, owner } = await setup()
    const viewer = await acme.role('Viewer', [])
    const stranger = '01900000-0000-7000-8000-000000000000'

    const roleResponse = await setRole(client, acme, owner, stranger, viewer.id)
    const grantsResponse = await setGrants(client, acme, owner, stranger, ['roles.manage'])

    roleResponse.assertStatus(404)
    roleResponse.assertBodyContains({ code: 'E_MEMBER_NOT_FOUND' })
    grantsResponse.assertStatus(404)
  })

  test('refuses to leave no one able to manage members', async ({ client, assert }) => {
    const { acme, owner } = await setup()

    const alone = await setRole(client, acme, owner, owner.id, null)
    alone.assertStatus(409)
    alone.assertBodyContains({ code: 'E_LAST_MANAGER' })

    const deputy = await acme.member()
    await setGrants(client, acme, owner, deputy.id, ['members.manage'])
    const handedOver = await setRole(client, acme, owner, owner.id, null)
    handedOver.assertStatus(200)

    const lastGrant = await setGrants(client, acme, deputy, deputy.id, [])
    lastGrant.assertStatus(409)
    assert.deepEqual(await permissionsOf(client, acme, deputy), ['members.manage'])
  })

  test('lists members with their role and permissions', async ({ client, assert }) => {
    const { acme, owner } = await setup()
    const editor = await acme.role('Editor', ['roles.manage'])
    const member = await acme.member()
    await acme.assign(member, editor)
    await acme.grant(member, 'members.manage')

    const response = await client.visit('access.members.index').headers(acme.headers).loginAs(owner)

    response.assertStatus(200)
    const row = response.body().data.members.find(entry => entry.user.id === member.id)

    assert.isDefined(row)
    assert.equal(row?.roleId, editor.id)
    assert.deepEqual(row?.permissions, ['members.manage'])
    assert.equal(row?.user.email, member.email)
  })

  test('records role and permission changes, with the member and roles at the time', async ({
    client,
    assert,
  }) => {
    const { acme, owner } = await setup()
    const target = await acme.member()
    const editor = await acme.role('Editor', [])

    await setRole(client, acme, owner, target.id, editor.id)
    await setRole(client, acme, owner, target.id, null)
    await setGrants(client, acme, owner, target.id, ['roles.manage'])

    const events = await AuditEvent.query().where('tenant_id', acme.tenant.id).orderBy('id')
    const member = { email: target.email, fullName: null }

    assert.deepEqual(
      events.map(event => [event.type, event.actorId, event.subjectId, event.data]),
      [
        [
          'member.role_changed',
          owner.id,
          target.id,
          { member, from: null, to: { id: editor.id, name: 'Editor' } },
        ],
        [
          'member.role_changed',
          owner.id,
          target.id,
          { member, from: { id: editor.id, name: 'Editor' }, to: null },
        ],
        [
          'member.permissions_changed',
          owner.id,
          target.id,
          { member, from: [], to: ['roles.manage'] },
        ],
      ],
    )
  })
})
