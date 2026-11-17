import { DateTime } from 'luxon'
import { account, sessionIdOf, signUp } from '#tests/accounts'
import { test } from '@japa/runner'
import { sessionOf } from '#tests/sessions'
import db from '@adonisjs/lucid/services/db'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'

async function login(client: ApiClient, email: string, userAgent: string) {
  const response = await client
    .visit('auth.access_tokens.store')
    .header('user-agent', userAgent)
    .json({ email, password: account.password })

  const { token } = sessionOf(response.body().data)

  return token
}

test.group('Auth | sessions', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('login stores the device info, shown back on the session list', async ({
    client,
    assert,
  }) => {
    await signUp(client, 'ada@example.com')
    const token = await login(client, 'ada@example.com', 'ada-browser/1.0')

    const response = await client.visit('profile.sessions.index').bearerToken(token)

    response.assertStatus(200)
    assert.containSubset(response.body().data, [
      { id: sessionIdOf(token), userAgent: 'ada-browser/1.0', current: true },
    ])
  })

  test('lists only the user’s own sessions, excluding another user’s and impersonation tokens', async ({
    client,
    assert,
  }) => {
    const token = await signUp(client, 'ada@example.com')
    const otherToken = await signUp(client, 'grace@example.com')

    // A second session of ada's own, so the list proves it isn't just "the current token".
    const secondToken = await login(client, 'ada@example.com', 'device-c')

    // An impersonation token looks like one of ada's own rows (same tokenable_id): fake one the
    // way the admin module's action writes it, to prove the list excludes it by impersonator_id.
    const grace = await db
      .query<{ id: string }>()
      .from('users')
      .where('email', 'grace@example.com')
      .firstOrFail()

    await db
      .from('auth_access_tokens')
      .where('id', sessionIdOf(secondToken))
      .update({ impersonator_id: grace.id })

    const response = await client.visit('profile.sessions.index').bearerToken(token)

    response.assertStatus(200)
    const ids = response.body().data.map((row: { id: string }) => row.id)
    assert.deepEqual(ids, [sessionIdOf(token)])
    assert.notInclude(ids, sessionIdOf(otherToken))
    assert.notInclude(ids, sessionIdOf(secondToken))
  })

  test('revoking a session makes it answer 401 afterwards', async ({ client }) => {
    const token = await signUp(client, 'ada@example.com')
    const other = await login(client, 'ada@example.com', 'device-b')

    const response = await client
      .visit('profile.sessions.destroy', { id: sessionIdOf(other) })
      .bearerToken(token)

    response.assertStatus(200)

    const revoked = await client.visit('profile.profile.show').bearerToken(other)
    revoked.assertStatus(401)

    const stillWorks = await client.visit('profile.profile.show').bearerToken(token)
    stillWorks.assertStatus(200)
  })

  test('revoking another user’s session id answers 404', async ({ client }) => {
    const token = await signUp(client, 'ada@example.com')
    const otherToken = await signUp(client, 'grace@example.com')

    const response = await client
      .visit('profile.sessions.destroy', { id: sessionIdOf(otherToken) })
      .bearerToken(token)

    response.assertStatus(404)
    response.assertBodyContains({ code: 'E_SESSION_NOT_FOUND' })
  })

  test('revoking every other session keeps the current one working', async ({ client, assert }) => {
    const token = await signUp(client, 'ada@example.com')
    const other = await login(client, 'ada@example.com', 'device-b')

    const response = await client.visit('profile.sessions.destroy_all').bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data.revoked, 1)

    const revoked = await client.visit('profile.profile.show').bearerToken(other)
    revoked.assertStatus(401)

    const stillWorks = await client.visit('profile.profile.show').bearerToken(token)
    stillWorks.assertStatus(200)
  })

  // Regression: with nothing to revoke the write records no event, and the audit check answers 500.
  test('revoking every other session when there is none answers 200', async ({
    client,
    assert,
  }) => {
    const token = await signUp(client, 'ada@example.com')

    const response = await client.visit('profile.sessions.destroy_all').bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data.revoked, 0)
  })

  test('refuses to revoke sessions while impersonating', async ({ client }) => {
    const token = await signUp(client, 'ada@example.com')

    const ada = await db
      .query<{ id: string }>()
      .from('users')
      .where('email', 'ada@example.com')
      .firstOrFail()

    await db
      .from('auth_access_tokens')
      .where('id', sessionIdOf(token))
      .update({ impersonator_id: ada.id })

    const destroy = await client
      .visit('profile.sessions.destroy', { id: sessionIdOf(token) })
      .bearerToken(token)

    destroy.assertStatus(403)
    destroy.assertBodyContains({ code: 'E_IMPERSONATING' })

    const destroyAll = await client.visit('profile.sessions.destroy_all').bearerToken(token)
    destroyAll.assertStatus(403)
  })

  // Regression: a session issued with no expiry (or one whose idle timeout already passed)
  // would stay usable forever instead of dying after 30 days of no activity.
  test('a token unused past its 30-day idle timeout answers 401', async ({ client }) => {
    const token = await signUp(client, 'ada@example.com')

    await db
      .from('auth_access_tokens')
      .where('id', sessionIdOf(token))
      .update({ expires_at: DateTime.now().minus({ days: 1 }).toJSDate() })

    const response = await client.visit('profile.profile.show').bearerToken(token)
    response.assertStatus(401)
  })

  // Regression: a token pushed just past the 30-day mark should die; one short of it, from a
  // request made since, should keep working. Proves the slide, not just the initial expiry.
  test('using a token pushes its 30-day idle timeout forward', async ({ client, assert }) => {
    const token = await signUp(client, 'ada@example.com')

    await db
      .from('auth_access_tokens')
      .where('id', sessionIdOf(token))
      .update({ expires_at: DateTime.now().plus({ days: 1 }).toJSDate() })

    const used = await client.visit('profile.profile.show').bearerToken(token)
    used.assertStatus(200)

    const row = await db
      .query<{ expires_at: Date }>()
      .from('auth_access_tokens')
      .where('id', sessionIdOf(token))
      .firstOrFail()

    assert.isAbove(DateTime.fromJSDate(row.expires_at).diffNow('days').days, 29)
  })

  // Regression: extending impersonation would let an admin's time-boxed access to an account
  // outlive the 1-hour cap just by using it.
  test('does not extend an impersonation token’s expiry', async ({ client, assert }) => {
    const token = await signUp(client, 'ada@example.com')

    const ada = await db
      .query<{ id: string }>()
      .from('users')
      .where('email', 'ada@example.com')
      .firstOrFail()

    const originalExpiry = DateTime.now().plus({ minutes: 1 }).toJSDate()

    await db
      .from('auth_access_tokens')
      .where('id', sessionIdOf(token))
      .update({ impersonator_id: ada.id, expires_at: originalExpiry })

    const response = await client.visit('profile.profile.show').bearerToken(token)
    response.assertStatus(200)

    const row = await db
      .query<{ expires_at: Date }>()
      .from('auth_access_tokens')
      .where('id', sessionIdOf(token))
      .firstOrFail()

    assert.equal(row.expires_at.getTime(), originalExpiry.getTime())
  })
})
