import { test } from '@japa/runner'
import { account, signUp } from '#tests/accounts'
import { sessionOf } from '#tests/sessions'
import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import type { ApiClient } from '@japa/api-client'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'
import { enableTwoFactor, totpCode } from '#auth/tests/two_factor'

/** Signs up an account with confirmed two-factor, and returns the secret its app holds. */
async function signUpWithTwoFactor(client: ApiClient, email: string) {
  await signUp(client, email)

  return enableTwoFactor(await User.findByOrFail('email', email))
}

/**
 * Enrolls through the API with the code of the previous step, so the current one stays unused
 * for the test's own step.
 */
async function enroll(client: ApiClient, token: string) {
  const started = await client.visit('profile.two_factor.store').bearerToken(token)
  const { secret } = started.body().data

  const confirmed = await client
    .visit('profile.two_factor.confirm')
    .json({ password: account.password, code: totpCode(secret, -1) })
    .bearerToken(token)

  return { secret, recoveryCodes: confirmed.body().data.recoveryCodes }
}

function login(client: ApiClient, email: string) {
  return client.visit('auth.access_tokens.store').json({ email, password: account.password })
}

async function challengeFor(client: ApiClient, email: string) {
  const response = await login(client, email)
  const data = response.body().data

  if (!data.twoFactorRequired) throw new Error('expected a two-factor challenge')

  return data.challenge
}

function secondStep(
  client: ApiClient,
  body: { challenge: string; code?: string; recoveryCode?: string },
) {
  return client.visit('auth.two_factor_logins.store').json(body)
}

test.group('Auth | two-factor login', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: the password alone opens a session on an account with two-factor.
  test('answers a challenge instead of a token, and the challenge with a code opens a session', async ({
    client,
    assert,
  }) => {
    const secret = await signUpWithTwoFactor(client, 'ada@example.com')

    const first = await login(client, 'ada@example.com')

    first.assertStatus(200)
    assert.isTrue(first.body().data.twoFactorRequired)
    assert.notProperty(first.body().data, 'token')
    assert.notProperty(first.body().data, 'user')

    const second = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      code: totpCode(secret),
    })

    second.assertStatus(200)
    const profile = await client.visit('profile.profile.show').bearerToken(second.body().data.token)
    profile.assertStatus(200)
    assert.isTrue(profile.body().data.twoFactorEnabled)

    const loggedIn = await AuditEvent.query().where('type', 'auth.logged_in').firstOrFail()
    assert.deepEqual(loggedIn.data, { email: 'ada@example.com', factor: 'totp' })
  })

  // Regression: a typo burns the challenge, or a wrong code passes.
  test('a wrong code fails and leaves the challenge usable', async ({ client, assert }) => {
    const secret = await signUpWithTwoFactor(client, 'ada@example.com')
    const challenge = await challengeFor(client, 'ada@example.com')

    const wrong = await secondStep(client, { challenge, code: '000000' })

    wrong.assertStatus(400)
    wrong.assertBodyContains({ code: 'E_INVALID_TWO_FACTOR_CODE' })
    assert.equal((await AuditEvent.query().where('type', 'auth.two_factor_failed')).length, 1)

    const right = await secondStep(client, { challenge, code: totpCode(secret) })
    right.assertStatus(200)
  })

  // Regression: a code seen over someone's shoulder signs in again within its 30 seconds.
  test('refuses a code whose time step was already used', async ({ client }) => {
    const secret = await signUpWithTwoFactor(client, 'ada@example.com')
    const code = totpCode(secret)

    const first = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      code,
    })

    first.assertStatus(200)

    const replayed = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      code,
    })

    replayed.assertStatus(400)
    replayed.assertBodyContains({ code: 'E_INVALID_TWO_FACTOR_CODE' })

    // The previous step is inside the drift window but before the one used: refused too.
    const older = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      code: totpCode(secret, -1),
    })

    older.assertStatus(400)
  })

  // Regression: a recovery code signs in more than once.
  test('a recovery code signs in once', async ({ client, assert }) => {
    const { recoveryCodes } = await enroll(client, await signUp(client, 'ada@example.com'))
    const [recoveryCode] = recoveryCodes

    if (recoveryCode === undefined) throw new Error('expected recovery codes from enrollment')

    const used = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      recoveryCode: recoveryCode.toUpperCase(),
    })

    used.assertStatus(200)

    const again = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      recoveryCode,
    })

    again.assertStatus(400)
    again.assertBodyContains({ code: 'E_INVALID_TWO_FACTOR_CODE' })

    const recorded = await AuditEvent.query().where('type', 'auth.recovery_code_used').firstOrFail()
    assert.deepEqual(recorded.data, { email: 'ada@example.com', remaining: 9 })
  })

  // Regression: a challenge made up by the client, or kept past five minutes, opens a session.
  test('refuses a forged, tampered or expired challenge', async ({ client }) => {
    const secret = await signUpWithTwoFactor(client, 'ada@example.com')
    const challenge = await challengeFor(client, 'ada@example.com')

    const realNow = Date.now
    Date.now = () => realNow() - 6 * 60_000

    let expired: string

    try {
      expired = await challengeFor(client, 'ada@example.com')
    } finally {
      Date.now = realNow
    }

    const tampered = `${challenge.slice(0, -2)}${challenge.endsWith('AA') ? 'BB' : 'AA'}`

    for (const candidate of ['not-a-challenge', tampered, expired]) {
      const response = await secondStep(client, { challenge: candidate, code: totpCode(secret) })

      response.assertStatus(400)
      response.assertBodyContains({ code: 'E_INVALID_TWO_FACTOR_CHALLENGE' })
    }
  })

  // Regression: an account disabled after its password step still gets a session.
  test('refuses a disabled account at the second step', async ({ client }) => {
    const secret = await signUpWithTwoFactor(client, 'ada@example.com')
    const challenge = await challengeFor(client, 'ada@example.com')

    await db.from('users').where('email', 'ada@example.com').update({ disabled_at: new Date() })

    const response = await secondStep(client, { challenge, code: totpCode(secret) })

    response.assertStatus(403)
    response.assertBodyContains({ code: 'E_ACCOUNT_DISABLED' })
  })

  // Regression: the second step has no per-user limit, so a million codes can be tried.
  test('blocks the second step after 5 wrong codes for the user, even with a new challenge', async ({
    client,
  }) => {
    const secret = await signUpWithTwoFactor(client, 'ada@example.com')

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await secondStep(client, {
        challenge: await challengeFor(client, 'ada@example.com'),
        code: '000000',
      })

      response.assertStatus(400)
    }

    const blocked = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      code: totpCode(secret),
    })

    blocked.assertStatus(429)
    blocked.assertHeader('retry-after')
  })
})

test.group('Auth | two-factor enrollment', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: confirming leaves a password-only session alive, or the codes leak into storage.
  test('confirming turns it on, returns recovery codes once and signs out every other session', async ({
    client,
    assert,
  }) => {
    const other = await signUp(client, 'ada@example.com')

    const { token: current } = sessionOf((await login(client, 'ada@example.com')).body().data)

    const started = await client.visit('profile.two_factor.store').bearerToken(current)

    started.assertStatus(200)
    const { secret, uri } = started.body().data
    assert.match(uri, /^otpauth:\/\/totp\/.+:ada%40example\.com\?/)
    assert.include(uri, `secret=${secret}`)

    const wrongPassword = await client
      .visit('profile.two_factor.confirm')
      .json({ password: 'not-the-password', code: totpCode(secret) })
      .bearerToken(current)

    wrongPassword.assertStatus(400)
    wrongPassword.assertBodyContains({ code: 'E_INVALID_PASSWORD' })

    const wrong = await client
      .visit('profile.two_factor.confirm')
      .json({ password: account.password, code: '000000' })
      .bearerToken(current)

    wrong.assertStatus(400)

    const confirmed = await client
      .visit('profile.two_factor.confirm')
      .json({ password: account.password, code: totpCode(secret) })
      .bearerToken(current)

    confirmed.assertStatus(200)
    const { recoveryCodes } = confirmed.body().data
    assert.lengthOf(recoveryCodes, 10)
    assert.lengthOf(new Set(recoveryCodes), 10)

    for (const code of recoveryCodes) assert.match(code, /^[a-z2-9]{5}-[a-z2-9]{5}$/)

    const stored: { code_hash: string }[] = await db.from('two_factor_recovery_codes')
    assert.lengthOf(stored, 10)

    for (const row of stored) assert.notInclude(recoveryCodes, row.code_hash)

    const user = await User.findByOrFail('email', 'ada@example.com')
    assert.isNotNull(user.twoFactorSecret)
    assert.notInclude(user.twoFactorSecret ?? '', secret)

    ;(await client.visit('profile.profile.show').bearerToken(other)).assertStatus(401)

    const profile = await client.visit('profile.profile.show').bearerToken(current)
    profile.assertStatus(200)
    assert.isTrue(profile.body().data.twoFactorEnabled)

    const status = await client.visit('profile.two_factor.show').bearerToken(current)
    status.assertBody({ data: { enabled: true, recoveryCodesLeft: 10 } })

    const restart = await client.visit('profile.two_factor.store').bearerToken(current)
    restart.assertStatus(409)
    restart.assertBodyContains({ code: 'E_TWO_FACTOR_ALREADY_ENABLED' })

    assert.equal((await AuditEvent.query().where('type', 'auth.two_factor_enabled')).length, 1)
  })

  // Regression: a started but unconfirmed secret locks the user out of a password-only login.
  test('a pending secret changes nothing about signing in', async ({ client, assert }) => {
    const token = await signUp(client, 'ada@example.com')
    await client.visit('profile.two_factor.store').bearerToken(token)

    const response = await login(client, 'ada@example.com')

    response.assertStatus(200)
    assert.isFalse(response.body().data.twoFactorRequired)
    assert.property(response.body().data, 'token')
  })

  // Regression: an admin acting as the user changes how the user signs in.
  test('refuses enrollment while impersonating', async ({ client }) => {
    const token = await signUp(client, 'ada@example.com')
    const ada = await User.findByOrFail('email', 'ada@example.com')
    await db
      .from('auth_access_tokens')
      .where('tokenable_id', ada.id)
      .update({ impersonator_id: ada.id })

    const started = await client.visit('profile.two_factor.store').bearerToken(token)
    started.assertStatus(403)
    started.assertBodyContains({ code: 'E_IMPERSONATING' })

    const confirmed = await client
      .visit('profile.two_factor.confirm')
      .json({ password: account.password, code: '123456' })
      .bearerToken(token)

    confirmed.assertStatus(403)
  })
})

test.group('Auth | two-factor disable and recovery codes', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: a stolen session alone, without the password and a code, turns two-factor off.
  test('disabling needs the password and a code, then the password alone signs in', async ({
    client,
    assert,
  }) => {
    const token = await signUp(client, 'ada@example.com')
    const secret = await enableTwoFactor(await User.findByOrFail('email', 'ada@example.com'))

    const wrongPassword = await client
      .visit('profile.two_factor.destroy')
      .json({ password: 'wrong-password', code: totpCode(secret) })
      .bearerToken(token)

    wrongPassword.assertStatus(400)
    wrongPassword.assertBodyContains({ code: 'E_INVALID_PASSWORD' })

    const wrongCode = await client
      .visit('profile.two_factor.destroy')
      .json({ password: account.password, code: '000000' })
      .bearerToken(token)

    wrongCode.assertStatus(400)
    wrongCode.assertBodyContains({ code: 'E_INVALID_TWO_FACTOR_CODE' })

    const disabled = await client
      .visit('profile.two_factor.destroy')
      .json({ password: account.password, code: totpCode(secret) })
      .bearerToken(token)

    disabled.assertStatus(200)

    const response = await login(client, 'ada@example.com')
    assert.isFalse(response.body().data.twoFactorRequired)

    const profile = await client.visit('profile.profile.show').bearerToken(token)
    assert.isFalse(profile.body().data.twoFactorEnabled)
  })

  // Regression: codes from before a regeneration still sign in.
  test('regenerating recovery codes invalidates the old ones', async ({ client, assert }) => {
    const token = await signUp(client, 'ada@example.com')
    const { secret, recoveryCodes } = await enroll(client, token)
    const [oldCode] = recoveryCodes

    if (oldCode === undefined) throw new Error('expected recovery codes from enrollment')

    const regenerated = await client
      .visit('profile.two_factor.regenerate_recovery_codes')
      .json({ password: account.password, code: totpCode(secret) })
      .bearerToken(token)

    regenerated.assertStatus(200)
    const [newCode] = regenerated.body().data.recoveryCodes

    if (newCode === undefined) throw new Error('expected regenerated recovery codes')
    assert.notEqual(newCode, oldCode)

    const withOld = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      recoveryCode: oldCode,
    })

    withOld.assertStatus(400)

    const withNew = await secondStep(client, {
      challenge: await challengeFor(client, 'ada@example.com'),
      recoveryCode: newCode,
    })

    withNew.assertStatus(200)
  })
})
