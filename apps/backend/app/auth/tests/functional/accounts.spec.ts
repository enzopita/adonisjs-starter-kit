import { test } from '@japa/runner'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'

/** The access token's id, which a session's audit events carry: `oat_<base64url id>.<secret>`. */
function sessionIdOf(token: string) {
  return Buffer.from(token.slice('oat_'.length).split('.')[0]!, 'base64url').toString()
}

const account = {
  fullName: null,
  password: 'password123',
  passwordConfirmation: 'password123',
}

test.group('Auth | accounts', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('rejects a signup whose email differs from an account only in case', async ({ client }) => {
    await client.visit('auth.new_account.store').json({ ...account, email: 'Ada@Example.com' })

    const response = await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'ada@example.com' })

    response.assertStatus(422)
  })

  test('logs in with the email in any case', async ({ client }) => {
    await client.visit('auth.new_account.store').json({ ...account, email: 'Ada@Example.com' })

    const response = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ADA@example.COM', password: account.password })

    response.assertStatus(200)
  })

  test('records the sign-up, attributed to the new account', async ({ client, assert }) => {
    const response = await client
      .visit('auth.new_account.store')
      .json({ ...account, email: 'ada@example.com' })

    const userId = response.body().data.user.id
    const event = await AuditEvent.findByOrFail('type', 'auth.signed_up')

    assert.deepInclude(event.toJSON(), {
      actorId: userId,
      subjectId: userId,
      tenantId: null,
      data: { email: 'ada@example.com', fullName: null },
    })
  })

  test('records a login and its logout under the session they open and close', async ({
    client,
    assert,
  }) => {
    await client.visit('auth.new_account.store').json({ ...account, email: 'ada@example.com' })

    const login = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'ada@example.com', password: account.password })

    const { token, user } = login.body().data
    await client.visit('profile.access_tokens.destroy').bearerToken(token)

    const events = await AuditEvent.query()
      .whereIn('type', ['auth.logged_in', 'auth.logged_out'])
      .orderBy('id')

    assert.deepEqual(
      events.map(event => [event.type, event.actorId, event.sessionId]),
      [
        ['auth.logged_in', user.id, sessionIdOf(token)],
        ['auth.logged_out', user.id, sessionIdOf(token)],
      ],
    )
  })

  test('records a failed login with the email tried, never the password', async ({
    client,
    assert,
  }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .json({ email: 'nobody@example.com', password: 'guess-1234' })

    response.assertStatus(400)
    const event = await AuditEvent.findByOrFail('type', 'auth.login_failed')
    assert.deepInclude(event.toJSON(), { actorId: null, data: { email: 'nobody@example.com' } })
  })
})
