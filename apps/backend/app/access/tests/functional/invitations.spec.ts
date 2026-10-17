import crypto from 'node:crypto'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import Invitation from '#access/models/invitation'
import InvitationMail from '#access/mails/invitation_mail'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, workspace } from '#access/tests/seed'

async function setup() {
  const acme = await workspace()
  const owner = await acme.member()
  await acme.assign(owner, await acme.role('Owner', ['roles.manage', 'members.manage']))

  return { acme, owner }
}

/** Pulls the raw token out of the invitation link in the most recently queued mail. */
function lastToken(fake: ReturnType<typeof mail.fake>) {
  const queued = fake.mails.queued()
  const html = queued[queued.length - 1]?.message.toJSON().message.html

  if (!html) throw new Error('The queued mail has no HTML body')

  // SAFETY: InvitationMail only ever calls message.htmlView(), which always renders to a string.
  const match = (html as string).match(/href="[^"]*\/invitations\/([a-f0-9]+)"/)
  const token = match?.[1]

  if (!token) throw new Error('No invitation link found in the queued mail')

  return token
}

test.group('Access | invitations', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('requires members.manage on every route', async ({ client }) => {
    const { acme } = await setup()
    const plain = await acme.member()

    const invitation = await acme.inside(() =>
      Invitation.create({
        email: 'guest@example.com',
        tokenHash: 'a'.repeat(64),
        expiresAt: DateTime.now().plus({ days: 7 }),
      }),
    )

    const responses = [
      await client.visit('access.members.index').headers(acme.headers).loginAs(plain),
      await client.visit('access.invitations.index').headers(acme.headers).loginAs(plain),
      await client
        .visit('access.invitations.store')
        .json({ email: 'guest2@example.com', roleId: null })
        .headers(acme.headers)
        .loginAs(plain),
      await client
        .visit('access.invitations.destroy', { id: invitation.id })
        .headers(acme.headers)
        .loginAs(plain),
    ]

    for (const response of responses) response.assertStatus(403)
  })

  test('requires auth on every route, including accept', async ({ client }) => {
    const { acme } = await setup()

    const responses = [
      await client.visit('access.members.index').headers(acme.headers),
      await client.visit('access.invitations.index').headers(acme.headers),
      await client
        .visit('access.invitations.store')
        .json({ email: 'guest@example.com', roleId: null })
        .headers(acme.headers),
      await client.visit('invitation_accept.store').json({ token: 'anything' }),
    ]

    for (const response of responses) response.assertStatus(401)
  })

  test('mails the invitation in the inviter’s locale', async ({ client, assert }) => {
    using fake = mail.fake()
    const { acme, owner } = await setup()

    await client
      .visit('access.invitations.store')
      .header('accept-language', 'pt-BR')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner)

    const queued = fake.mails.queued()
    assert.equal(
      queued[queued.length - 1]?.message.toJSON().message.subject,
      'Você recebeu um convite',
    )
  })

  test('invites, lists, and revokes', async ({ client, assert }) => {
    using fake = mail.fake()
    const { acme, owner } = await setup()
    const editor = await acme.role('Editor', ['roles.manage'])

    const created = await client
      .visit('access.invitations.store')
      .json({ email: 'Guest@Example.com', roleId: editor.id })
      .headers(acme.headers)
      .loginAs(owner)

    created.assertStatus(200)
    created.assertBodyContains({ data: { email: 'guest@example.com', roleId: editor.id } })
    fake.mails.assertQueued(InvitationMail, ({ message }) => message.hasTo('guest@example.com'))

    const listed = await client
      .visit('access.invitations.index')
      .headers(acme.headers)
      .loginAs(owner)

    assert.lengthOf(listed.body().data, 1)

    const revoked = await client
      .visit('access.invitations.destroy', { id: created.body().data.id })
      .headers(acme.headers)
      .loginAs(owner)

    revoked.assertStatus(200)

    const listedAfter = await client
      .visit('access.invitations.index')
      .headers(acme.headers)
      .loginAs(owner)

    assert.lengthOf(listedAfter.body().data, 0)
  })

  test('answers 404 for an unknown invitation id', async ({ client }) => {
    const { acme, owner } = await setup()
    const stranger = '01900000-0000-7000-8000-000000000000'

    const response = await client
      .visit('access.invitations.destroy', { id: stranger })
      .headers(acme.headers)
      .loginAs(owner)

    response.assertStatus(404)
  })

  test('answers 409 for an email that already belongs to a member, in any case', async ({
    client,
  }) => {
    const { acme, owner } = await setup()
    const member = await acme.member()

    const response = await client
      .visit('access.invitations.store')
      .json({ email: member.email.toUpperCase(), roleId: null })
      .headers(acme.headers)
      .loginAs(owner)

    response.assertStatus(409)
    response.assertBodyContains({ code: 'E_ALREADY_MEMBER' })
  })

  test('re-inviting the same email replaces the token', async ({ client, assert }) => {
    using fake = mail.fake()
    const { acme, owner } = await setup()

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner)
    const firstToken = lastToken(fake)

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner)
    const secondToken = lastToken(fake)

    assert.notEqual(firstToken, secondToken)

    const staleAccept = await client
      .visit('invitation_accept.store')
      .json({ token: firstToken })
      .loginAs(await createUser())

    staleAccept.assertStatus(404)
    staleAccept.assertBodyContains({ code: 'E_INVITATION_NOT_FOUND' })
  })

  test('accept answers 404 for an unknown token', async ({ client }) => {
    const response = await client
      .visit('invitation_accept.store')
      .json({ token: 'unknown-token' })
      .loginAs(await createUser())

    response.assertStatus(404)
    response.assertBodyContains({ code: 'E_INVITATION_NOT_FOUND' })
  })

  test('accept answers 404 for an expired invitation', async ({ client }) => {
    const { acme } = await setup()

    await acme.inside(() =>
      Invitation.create({
        email: 'guest@example.com',
        tokenHash: crypto.createHash('sha256').update('expired-token').digest('hex'),
        expiresAt: DateTime.now().minus({ minutes: 1 }),
      }),
    )

    const response = await client
      .visit('invitation_accept.store')
      .json({ token: 'expired-token' })
      .loginAs(await createUser())

    response.assertStatus(404)
    response.assertBodyContains({ code: 'E_INVITATION_NOT_FOUND' })
  })

  test('accept answers 403 when the signed-in email differs', async ({ client }) => {
    using fake = mail.fake()
    const { acme, owner } = await setup()

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner)
    const token = lastToken(fake)

    const response = await client
      .visit('invitation_accept.store')
      .json({ token })
      .loginAs(await createUser())

    response.assertStatus(403)
    response.assertBodyContains({ code: 'E_INVITATION_EMAIL_MISMATCH' })
  })

  test('accept creates the membership and role, and is idempotent', async ({ client, assert }) => {
    using fake = mail.fake()
    const { acme, owner } = await setup()
    const editor = await acme.role('Editor', ['roles.manage'])
    const guest = await createUser()
    await guest.merge({ email: 'guest@example.com' }).save()

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: editor.id })
      .headers(acme.headers)
      .loginAs(owner)
    const token = lastToken(fake)

    const accepted = await client.visit('invitation_accept.store').json({ token }).loginAs(guest)
    accepted.assertStatus(200)
    accepted.assertBodyContains({ data: { id: acme.tenant.id } })

    const permissions = await client
      .visit('access.my_permissions.show')
      .headers(acme.headers)
      .loginAs(guest)

    assert.deepEqual(permissions.body().data.permissions, ['roles.manage'])

    // Idempotent: the invitation is gone after the first accept, but a retry with the same
    // token must not throw on the now-existing membership.
    const retried = await client.visit('invitation_accept.store').json({ token }).loginAs(guest)
    retried.assertStatus(404)
  })

  test('an invitation from one tenant is invisible and unrevokable from another', async ({
    client,
    assert,
  }) => {
    const { acme, owner } = await setup()
    const globex = await workspace('Globex')
    const globexOwner = await globex.member()
    await globex.assign(globexOwner, await globex.role('Owner', ['members.manage']))

    const created = await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner)

    const fromGlobex = await client
      .visit('access.invitations.index')
      .headers(globex.headers)
      .loginAs(globexOwner)

    assert.lengthOf(fromGlobex.body().data, 0)

    const revoke = await client
      .visit('access.invitations.destroy', { id: created.body().data.id })
      .headers(globex.headers)
      .loginAs(globexOwner)

    revoke.assertStatus(404)
  })
})
