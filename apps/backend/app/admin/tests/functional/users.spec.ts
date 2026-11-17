import { test } from '@japa/runner'
import { linkToken } from '#tests/mails'
import { sessionOf } from '#tests/sessions'
import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import AuditEvent from '#core/models/audit_event'
import PlatformAdmin from '#access/models/platform_admin'
import testUtils from '@adonisjs/core/services/test_utils'
import { admin } from '#admin/tests/seed'
import { enableTwoFactor } from '#auth/tests/two_factor'
import PasswordResetMail from '#auth/mails/password_reset_mail'
import TwoFactorResetMail from '#admin/mails/two_factor_reset_mail'
import { countRecoveryCodes, replaceRecoveryCodes } from '#auth/services/two_factor'
import { createUser, workspace } from '#access/tests/seed'
import { releaseToken } from '#auth/services/sessions'

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
    assert.containSubset(response.body(), {
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
    assert.containSubset(admins.body().data, [{ platformAdmin: true, tenantCount: 0 }])
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
    const { token } = sessionOf(login.body().data)

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
      for (const route of [
        'admin.user_suspensions.store',
        'admin.impersonations.store',
        'admin.two_factor_resets.destroy',
      ] as const) {
        const response = await client.visit(route, { id: target.id }).loginAs(viewer)

        response.assertStatus(409)
        response.assertBodyContains({ code: 'E_PLATFORM_ADMIN_PROTECTED' })
      }
    }

    const untouched = await User.findOrFail(peer.id)
    assert.isNull(untouched.disabledAt)
    assert.isNotNull(untouched.twoFactorConfirmedAt)
  })

  // Regression: a reset leaves a session someone else holds working, keeps the old secret or
  // recovery codes, lets the old password alone sign in (a phished password plus a "lost device"
  // claim), mails no working reset link, keeps holding sign-in after the reset, or runs again on a
  // user without two-factor.
  test('resetting two-factor signs the user out and holds sign-in until the mailed link sets a new password', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake()
    const viewer = await admin()
    const ada = await createUser()
    ada.locale = 'pt-BR'
    await ada.save()
    await enableTwoFactor(ada)
    await replaceRecoveryCodes(db.connection(), ada.id)
    const session = await User.accessTokens.create(ada)
    const oldCredentials = { email: ada.email, password: 'password123' }

    const listRow = async () => {
      const list = await client.visit('admin.users.index').qs({ search: ada.email }).loginAs(viewer)

      return list.body().data[0]
    }

    assert.containSubset(await listRow(), { user: { twoFactorEnabled: true } })

    // The admin's own request locale (en-US here) must not leak into the user's mail: see the
    // locale regression test below.
    const reset = await client
      .visit('admin.two_factor_resets.destroy', { id: ada.id })
      .header('accept-language', 'en-US')
      .loginAs(viewer)

    reset.assertBody({ data: { id: ada.id, twoFactorEnabled: false } })
    assert.containSubset(await listRow(), { user: { twoFactorEnabled: false } })

    const stale = await client.visit('profile.profile.show').bearerToken(releaseToken(session))
    stale.assertStatus(401)

    const held = await client.visit('auth.access_tokens.store').json(oldCredentials)
    held.assertStatus(403)
    held.assertBodyContains({ code: 'E_PASSWORD_RESET_REQUIRED' })
    assert.notProperty(held.body(), 'data')
    assert.lengthOf(await db.from('auth_access_tokens').where('tokenable_id', ada.id), 0)
    assert.equal(await countRecoveryCodes(db.connection(), ada.id), 0)

    fake.mails.assertQueued(TwoFactorResetMail, ({ message }) => message.hasTo(ada.email))
    const mailed = fake.mails.queued()[0]?.message.toJSON().message
    assert.equal(mailed?.subject, 'Sua autenticação em dois fatores foi desativada')

    const resetToken = linkToken(fake, 'reset-password')

    const newPassword = 'new-password456'

    const chosen = await client
      .visit('auth.password_resets.update')
      .json({ token: resetToken, password: newPassword, passwordConfirmation: newPassword })

    chosen.assertStatus(200)
    assert.isNull((await User.findOrFail(ada.id)).passwordResetRequiredAt)

    const login = await client
      .visit('auth.access_tokens.store')
      .json({ email: ada.email, password: newPassword })

    login.assertStatus(200)
    assert.isString(sessionOf(login.body().data).token)

    const oldPassword = await client.visit('auth.access_tokens.store').json(oldCredentials)
    oldPassword.assertStatus(400)

    const again = await client
      .visit('admin.two_factor_resets.destroy', { id: ada.id })
      .loginAs(viewer)

    again.assertStatus(409)
    again.assertBodyContains({ code: 'E_TWO_FACTOR_NOT_ENABLED' })

    const unknown = await client
      .visit('admin.two_factor_resets.destroy', { id: crypto.randomUUID() })
      .loginAs(viewer)

    unknown.assertStatus(404)

    const events = await AuditEvent.query()
      .where('subject_id', ada.id)
      .whereIn('type', ['admin.two_factor_reset', 'auth.password_reset_required'])
      .orderBy('id')

    assert.deepEqual(
      events.map(event => [event.type, event.tenantId, event.actorId, event.data]),
      [
        ['admin.two_factor_reset', null, viewer.id, { email: ada.email }],
        ['auth.password_reset_required', null, null, { email: ada.email }],
      ],
    )
  })

  // Regression: forgot-password skips a user held by a two-factor reset, who is stuck once the
  // mailed link expires.
  test('a user held by a two-factor reset can still ask for a new reset link', async ({
    client,
  }) => {
    const viewer = await admin()
    const ada = await createUser()
    await enableTwoFactor(ada)

    await client.visit('admin.two_factor_resets.destroy', { id: ada.id }).loginAs(viewer)

    using fake = mail.fake()
    const requested = await client.visit('auth.password_resets.store').json({ email: ada.email })

    requested.assertStatus(200)
    fake.mails.assertQueued(PasswordResetMail, ({ message }) => message.hasTo(ada.email))
  })

  // Regression: a disabled user's two-factor is reset and they're mailed a link to a sign-in that
  // still refuses them.
  test('refuses to reset a disabled user’s two-factor', async ({ client, assert }) => {
    using fake = mail.fake()
    const viewer = await admin()
    const ada = await createUser()
    await enableTwoFactor(ada)
    await client.visit('admin.user_suspensions.store', { id: ada.id }).loginAs(viewer)

    const response = await client
      .visit('admin.two_factor_resets.destroy', { id: ada.id })
      .loginAs(viewer)

    response.assertStatus(409)
    response.assertBodyContains({ code: 'E_USER_DISABLED' })

    const untouched = await User.findOrFail(ada.id)
    assert.isNotNull(untouched.twoFactorConfirmedAt)
    assert.isNull(untouched.passwordResetRequiredAt)
    fake.mails.assertNoneQueued()
  })

  // Regression: the mail uses the admin's own request locale instead of the target's stored one.
  test('mails the two-factor reset in the target’s locale, not the admin’s', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake()
    const viewer = await admin()
    const ada = await createUser()
    ada.locale = 'pt-BR'
    await ada.save()
    await enableTwoFactor(ada)

    const reset = await client
      .visit('admin.two_factor_resets.destroy', { id: ada.id })
      .header('accept-language', 'en-US')
      .loginAs(viewer)

    reset.assertStatus(200)
    assert.equal(
      fake.mails.queued()[0]?.message.toJSON().message.subject,
      'Sua autenticação em dois fatores foi desativada',
    )
  })

  // Regression: granting twice fails or adds a second row, revoking leaves the admin in place, or
  // either change is missing from the user's account activity.
  test('grants platform admin idempotently and revokes it, both in the user’s activity', async ({
    client,
    assert,
  }) => {
    const viewer = await admin()
    const ada = await createUser()
    const isAdmin = async () => (await PlatformAdmin.findBy('userId', ada.id)) !== null

    const granted = await client
      .visit('admin.platform_admins.store', { id: ada.id })
      .loginAs(viewer)

    const again = await client.visit('admin.platform_admins.store', { id: ada.id }).loginAs(viewer)

    granted.assertBody({ data: { id: ada.id, platformAdmin: true } })
    again.assertStatus(200)
    assert.lengthOf(await PlatformAdmin.query().where('user_id', ada.id), 1)

    const revoked = await client
      .visit('admin.platform_admins.destroy', { id: ada.id })
      .loginAs(viewer)

    revoked.assertBody({ data: { id: ada.id, platformAdmin: false } })
    assert.isFalse(await isAdmin())

    const events = await AuditEvent.query()
      .where('subject_id', ada.id)
      .whereLike('type', 'admin.%')
      .orderBy('id')

    assert.deepEqual(
      events.map(event => [event.type, event.tenantId, event.actorId, event.data]),
      [
        ['admin.platform_admin_granted', null, viewer.id, { email: ada.email }],
        ['admin.platform_admin_granted', null, viewer.id, { email: ada.email }],
        ['admin.platform_admin_revoked', null, viewer.id, { email: ada.email }],
      ],
    )
  })

  // Regression: an admin revokes themself, which could leave the platform with no admin.
  test('refuses to revoke the caller’s own platform admin', async ({ client, assert }) => {
    const viewer = await admin()

    const response = await client
      .visit('admin.platform_admins.destroy', { id: viewer.id })
      .loginAs(viewer)

    response.assertStatus(409)
    response.assertBodyContains({ code: 'E_CANNOT_REVOKE_SELF' })
    assert.isNotNull(await PlatformAdmin.findBy('userId', viewer.id))
  })
})
