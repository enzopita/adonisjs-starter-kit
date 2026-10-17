import { test } from '@japa/runner'
import type User from '#users/models/user'
import type { ApiClient } from '@japa/api-client'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, makePlatformAdmin, workspace } from '#access/tests/seed'

async function admin() {
  const holder = await createUser()
  await makePlatformAdmin(holder)

  return holder
}

function impersonate(client: ApiClient, viewer: User, target: User) {
  return client.visit('admin.impersonations.store', { id: target.id }).loginAs(viewer)
}

test.group('Admin | impersonation', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: the token acts as someone else, or what the admin does through it is recorded as
  // the user alone.
  test('returns a token that acts as the user, every event attributed to the admin', async ({
    client,
    assert,
  }) => {
    const viewer = await admin()
    const acme = await workspace()
    const ada = await acme.member()
    await acme.assign(ada, await acme.role('Owner', ['roles.manage', 'audit.view']))

    const started = await impersonate(client, viewer, ada)
    started.assertStatus(200)
    assert.equal(started.body().data.user.id, ada.id)
    const token = started.body().data.token

    const profile = await client.visit('profile.profile.show').bearerToken(token)
    assert.equal(profile.body().data.email, ada.email)

    const created = await client
      .visit('access.roles.store')
      .json({ name: 'Editor', permissions: [] })
      .headers(acme.headers)
      .bearerToken(token)

    created.assertStatus(200)

    const trail = await client
      .visit('audit.audit_events.index')
      .headers(acme.headers)
      .bearerToken(token)

    assert.containsSubset(trail.body().data, [
      {
        actor: { id: ada.id },
        impersonator: { id: viewer.id, email: viewer.email },
        event: { type: 'role.created' },
      },
    ])

    const loggedOut = await client.visit('profile.access_tokens.destroy').bearerToken(token)
    loggedOut.assertStatus(200)
    const ended = await client.visit('profile.profile.show').bearerToken(token)
    ended.assertStatus(401)

    const events = await AuditEvent.query().whereIn('type', [
      'admin.impersonation_started',
      'role.created',
      'auth.logged_out',
    ])

    assert.sameDeepMembers(
      events.map(event => [event.type, event.actorId, event.impersonatorId]),
      [
        ['admin.impersonation_started', viewer.id, null],
        ['role.created', ada.id, viewer.id],
        ['auth.logged_out', ada.id, viewer.id],
      ],
    )
  })

  // Regression: impersonation hands out a session the disable just took away.
  test('refuses to impersonate a disabled user', async ({ client }) => {
    const viewer = await admin()
    const ada = await createUser()
    await client.visit('admin.user_suspensions.store', { id: ada.id }).loginAs(viewer)

    const response = await impersonate(client, viewer, ada)

    response.assertStatus(409)
    response.assertBodyContains({ code: 'E_USER_DISABLED' })
  })
})
