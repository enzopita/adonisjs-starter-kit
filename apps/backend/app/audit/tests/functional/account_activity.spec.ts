import { test } from '@japa/runner'
import type User from '#users/models/user'
import type { ApiClient } from '@japa/api-client'
import { createUser, workspace } from '#access/tests/seed'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'

function list(client: ApiClient, viewer: User) {
  return client.visit('audit.account_activity.index').loginAs(viewer)
}

function typesOf(response: Awaited<ReturnType<typeof list>>) {
  return response.body().data.map((row: { event: { type: string } }) => row.event.type)
}

test.group('Audit | account activity', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: a user reads another user's sign-ins, or tenant events leak into account activity.
  test('lists the user’s own account events only, newest first', async ({ client, assert }) => {
    const acme = await workspace()
    const ada = await acme.member()
    const grace = await createUser()
    const account = { tenantId: null, data: {} }

    await AuditEvent.create({ ...account, type: 'auth.signed_up', actorId: ada.id })
    await AuditEvent.create({ ...account, type: 'auth.logged_in', actorId: grace.id })
    await AuditEvent.create({ tenantId: acme.tenant.id, type: 'role.created', actorId: ada.id })
    await AuditEvent.create({ ...account, type: 'auth.logged_in', actorId: ada.id })

    const response = await list(client, ada)

    response.assertStatus(200)
    assert.deepEqual(typesOf(response), ['auth.logged_in', 'auth.signed_up'])
  })

  // Regression: a failed login on the user's email is hidden from them, or one on an email that
  // isn't theirs shows up.
  test('lists failed logins on the user’s email, with where they came from', async ({
    client,
    assert,
  }) => {
    const ada = await createUser()
    const attempt = { password: 'wrong-password' }

    await client.visit('auth.access_tokens.store').json({ ...attempt, email: ada.email })
    await client.visit('auth.access_tokens.store').json({ ...attempt, email: 'nobody@example.com' })

    const [attemptOnAda, ...others] = (await list(client, ada)).body().data

    assert.lengthOf(others, 0)
    assert.deepEqual(attemptOnAda?.event, {
      type: 'auth.login_failed',
      subject: { type: 'user', id: ada.id },
      data: { email: ada.email },
    })
    assert.isNull(attemptOnAda?.actor)
    assert.isString(attemptOnAda?.session.ip)
  })
})
