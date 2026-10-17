import { test } from '@japa/runner'
import User from '#users/models/user'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, makePlatformAdmin, workspace } from '#access/tests/seed'

async function admin() {
  const holder = await createUser()
  await makePlatformAdmin(holder)

  return holder
}

test.group('Admin | users', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: the search misses a name or an email, or the counts and flags are wrong.
  test('lists users by email, searched by email or name, with their status', async ({
    client,
    assert,
  }) => {
    const viewer = await admin()
    const acme = await workspace()
    const ada = await acme.member()
    ada.merge({ fullName: 'Ada Lovelace', email: 'ada@example.com' })
    await ada.save()
    await (await workspace('Other')).tenant.related('memberships').create({ userId: ada.id })
    await User.create({ email: 'lovelace@example.com', password: 'password123' })

    const response = await client
      .visit('admin.users.index')
      .qs({ search: 'LOVELACE', perPage: 1 })
      .loginAs(viewer)

    const admins = await client
      .visit('admin.users.index')
      .qs({ search: viewer.email })
      .loginAs(viewer)

    response.assertStatus(200)
    assert.containsSubset(response.body(), {
      data: [
        {
          user: { email: 'ada@example.com', fullName: 'Ada Lovelace' },
          disabledAt: null,
          platformAdmin: false,
          tenantCount: 2,
        },
      ],
      metadata: { total: 2 },
    })
    assert.containsSubset(admins.body().data, [{ platformAdmin: true, tenantCount: 0 }])
  })

  // Regression: a disabled user keeps a working session or can sign in again, the refusal
  // tells a wrong password apart, or enabling doesn't let them back.
  test('disabling signs the user out everywhere and refuses their login until enabled', async ({
    client,
    assert,
  }) => {
    const viewer = await admin()
    const ada = await createUser()
    const credentials = { email: ada.email, password: 'password123' }

    const login = await client.visit('auth.access_tokens.store').json(credentials)
    const token = login.body().data.token

    const disabled = await client
      .visit('admin.user_suspensions.store', { id: ada.id })
      .loginAs(viewer)

    const again = await client.visit('admin.user_suspensions.store', { id: ada.id }).loginAs(viewer)

    disabled.assertStatus(200)
    assert.isNotNull(disabled.body().data.disabledAt)
    assert.equal(again.body().data.disabledAt, disabled.body().data.disabledAt)

    const session = await client.visit('profile.profile.show').bearerToken(token)
    session.assertStatus(401)

    const refused = await client.visit('auth.access_tokens.store').json(credentials)
    refused.assertStatus(403)
    refused.assertBodyContains({ code: 'E_ACCOUNT_DISABLED' })

    const wrongPassword = await client
      .visit('auth.access_tokens.store')
      .json({ ...credentials, password: 'wrong-password' })

    wrongPassword.assertStatus(400)

    const enabled = await client
      .visit('admin.user_suspensions.destroy', { id: ada.id })
      .loginAs(viewer)

    enabled.assertBodyContains({ data: { disabledAt: null } })

    const back = await client.visit('auth.access_tokens.store').json(credentials)
    back.assertStatus(200)

    const events = await AuditEvent.query()
      .where('subject_id', ada.id)
      .whereLike('type', 'admin.%')
      .orderBy('id')

    assert.deepEqual(
      events.map(event => [event.type, event.tenantId, event.actorId, event.data]),
      [
        ['admin.user_disabled', null, viewer.id, { email: ada.email }],
        ['admin.user_disabled', null, viewer.id, { email: ada.email }],
        ['admin.user_enabled', null, viewer.id, { email: ada.email }],
      ],
    )
  })

  // Regression: an admin locks out or acts as another admin, or themselves.
  test('refuses to disable or impersonate a platform admin, the caller included', async ({
    client,
    assert,
  }) => {
    const viewer = await admin()
    const peer = await admin()

    for (const target of [viewer, peer]) {
      for (const route of ['admin.user_suspensions.store', 'admin.impersonations.store'] as const) {
        const response = await client.visit(route, { id: target.id }).loginAs(viewer)

        response.assertStatus(409)
        response.assertBodyContains({ code: 'E_PLATFORM_ADMIN_PROTECTED' })
      }
    }

    assert.isNull((await User.findOrFail(peer.id)).disabledAt)
  })
})
