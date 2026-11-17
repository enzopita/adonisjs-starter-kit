import testUtils from '@adonisjs/core/services/test_utils';
import mail from '@adonisjs/mail/services/main';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';

import InvitationMail from '#access/mails/invitation_mail';
import Invitation from '#access/models/invitation';
import { createUser, ownedWorkspace, workspace } from '#access/tests/seed';
import AuditEvent from '#core/models/audit_event';
import { hashToken } from '#core/tokens';
import { linkToken } from '#tests/mails';

test.group('Access | invitations', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('requires members.manage on every route', async ({ client }) => {
    const { acme } = await ownedWorkspace();
    const plain = await acme.member();

    const invitation = await acme.inside(() =>
      Invitation.create({
        email: 'guest@example.com',
        tokenHash: 'a'.repeat(64),
        expiresAt: DateTime.now().plus({ days: 7 }),
      })
    );

    const responses = [
      await client
        .visit('access.members.index')
        .headers(acme.headers)
        .loginAs(plain),
      await client
        .visit('access.invitations.index')
        .headers(acme.headers)
        .loginAs(plain),
      await client
        .visit('access.invitations.store')
        .json({ email: 'guest2@example.com', roleId: null })
        .headers(acme.headers)
        .loginAs(plain),
      await client
        .visit('access.invitations.destroy', { id: invitation.id })
        .headers(acme.headers)
        .loginAs(plain),
    ];

    for (const response of responses) response.assertStatus(403);
  });

  test('requires auth on every route, including accept', async ({ client }) => {
    const { acme } = await ownedWorkspace();

    const responses = [
      await client.visit('access.members.index').headers(acme.headers),
      await client.visit('access.invitations.index').headers(acme.headers),
      await client
        .visit('access.invitations.store')
        .json({ email: 'guest@example.com', roleId: null })
        .headers(acme.headers),
      await client.visit('invitation_accept.store').json({ token: 'anything' }),
    ];

    for (const response of responses) response.assertStatus(401);
  });

  test('mails the invitation in the inviter’s locale', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake();
    const { acme, owner } = await ownedWorkspace();

    await client
      .visit('access.invitations.store')
      .header('accept-language', 'pt-BR')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner);

    const queued = fake.mails.queued();
    assert.equal(
      queued[queued.length - 1]?.message.toJSON().message.subject,
      'Você recebeu um convite'
    );
  });

  test('invites, lists, and revokes', async ({ client, assert }) => {
    using fake = mail.fake();
    const { acme, owner } = await ownedWorkspace();
    const editor = await acme.role('Editor', ['roles.manage']);

    const created = await client
      .visit('access.invitations.store')
      .json({ email: 'Guest@Example.com', roleId: editor.id })
      .headers(acme.headers)
      .loginAs(owner);

    created.assertStatus(200);
    created.assertBodyContains({
      data: { email: 'guest@example.com', roleId: editor.id },
    });
    fake.mails.assertQueued(InvitationMail, ({ message }) =>
      message.hasTo('guest@example.com')
    );

    const listed = await client
      .visit('access.invitations.index')
      .headers(acme.headers)
      .loginAs(owner);

    assert.lengthOf(listed.body().data, 1);

    const revoked = await client
      .visit('access.invitations.destroy', { id: created.body().data.id })
      .headers(acme.headers)
      .loginAs(owner);

    revoked.assertStatus(200);

    const listedAfter = await client
      .visit('access.invitations.index')
      .headers(acme.headers)
      .loginAs(owner);

    assert.lengthOf(listedAfter.body().data, 0);
  });

  test('answers 404 for an unknown invitation id', async ({ client }) => {
    const { acme, owner } = await ownedWorkspace();
    const stranger = '01900000-0000-7000-8000-000000000000';

    const response = await client
      .visit('access.invitations.destroy', { id: stranger })
      .headers(acme.headers)
      .loginAs(owner);

    response.assertStatus(404);
  });

  test('answers 409 for an email that already belongs to a member, in any case', async ({
    client,
  }) => {
    const { acme, owner } = await ownedWorkspace();
    const member = await acme.member();

    const response = await client
      .visit('access.invitations.store')
      .json({ email: member.email.toUpperCase(), roleId: null })
      .headers(acme.headers)
      .loginAs(owner);

    response.assertStatus(409);
    response.assertBodyContains({ code: 'E_ALREADY_MEMBER' });
  });

  test('re-inviting the same email replaces the token', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake();
    const { acme, owner } = await ownedWorkspace();

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner);
    const firstToken = linkToken(fake, 'invitations');

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner);
    const secondToken = linkToken(fake, 'invitations');

    assert.notEqual(firstToken, secondToken);

    const staleAccept = await client
      .visit('invitation_accept.store')
      .json({ token: firstToken })
      .loginAs(await createUser());

    staleAccept.assertStatus(404);
    staleAccept.assertBodyContains({ code: 'E_INVITATION_NOT_FOUND' });
  });

  test('accept answers 404 for an unknown token', async ({ client }) => {
    const response = await client
      .visit('invitation_accept.store')
      .json({ token: 'unknown-token' })
      .loginAs(await createUser());

    response.assertStatus(404);
    response.assertBodyContains({ code: 'E_INVITATION_NOT_FOUND' });
  });

  test('accept answers 404 for an expired invitation', async ({ client }) => {
    const { acme } = await ownedWorkspace();

    await acme.inside(() =>
      Invitation.create({
        email: 'guest@example.com',
        tokenHash: hashToken('expired-token'),
        expiresAt: DateTime.now().minus({ minutes: 1 }),
      })
    );

    const response = await client
      .visit('invitation_accept.store')
      .json({ token: 'expired-token' })
      .loginAs(await createUser());

    response.assertStatus(404);
    response.assertBodyContains({ code: 'E_INVITATION_NOT_FOUND' });
  });

  test('accept answers 403 when the signed-in email differs', async ({
    client,
  }) => {
    using fake = mail.fake();
    const { acme, owner } = await ownedWorkspace();

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner);
    const token = linkToken(fake, 'invitations');

    const response = await client
      .visit('invitation_accept.store')
      .json({ token })
      .loginAs(await createUser());

    response.assertStatus(403);
    response.assertBodyContains({ code: 'E_INVITATION_EMAIL_MISMATCH' });
  });

  test('accept creates the membership and role, and verifies the email', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake();
    const { acme, owner } = await ownedWorkspace();
    const editor = await acme.role('Editor', ['roles.manage']);
    const guest = await createUser();
    await guest.merge({ email: 'guest@example.com' }).save();

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: editor.id })
      .headers(acme.headers)
      .loginAs(owner);
    const token = linkToken(fake, 'invitations');

    const accepted = await client
      .visit('invitation_accept.store')
      .json({ token })
      .loginAs(guest);
    accepted.assertStatus(200);
    accepted.assertBodyContains({ data: { id: acme.tenant.id } });

    const permissions = await client
      .visit('access.my_permissions.show')
      .headers(acme.headers)
      .loginAs(guest);

    assert.deepEqual(permissions.body().data.permissions, ['roles.manage']);

    const profile = await client.visit('profile.profile.show').loginAs(guest);
    assert.isNotNull(profile.body().data.emailVerifiedAt);
  });

  // Regression: a retry after a crash between the membership write and the invitation's delete
  // fails on the existing membership, or joins the member a second time.
  test('accept by someone already a member only spends the invitation', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake();
    const { acme, owner } = await ownedWorkspace();
    const editor = await acme.role('Editor', ['roles.manage']);
    const guest = await createUser();
    await guest.merge({ email: 'guest@example.com' }).save();

    await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: editor.id })
      .headers(acme.headers)
      .loginAs(owner);
    await acme.tenant.related('memberships').create({ userId: guest.id });

    const accepted = await client
      .visit('invitation_accept.store')
      .json({ token: linkToken(fake, 'invitations') })
      .loginAs(guest);

    accepted.assertStatus(200);
    assert.lengthOf(
      await acme.tenant
        .related('memberships')
        .query()
        .where('user_id', guest.id),
      1
    );
    assert.isNull(
      await acme.inside(() => Invitation.findBy('email', 'guest@example.com'))
    );
    const events = await AuditEvent.query().where('tenant_id', acme.tenant.id);
    assert.notInclude(
      events.map((event) => event.type),
      'member.joined'
    );
    assert.include(
      events.map((event) => event.type),
      'invitation.accepted'
    );
  });

  test('an invitation from one tenant is invisible and unrevokable from another', async ({
    client,
    assert,
  }) => {
    const { acme, owner } = await ownedWorkspace();
    const globex = await workspace('Globex');
    const globexOwner = await globex.member();
    await globex.assign(
      globexOwner,
      await globex.role('Owner', ['members.manage'])
    );

    const created = await client
      .visit('access.invitations.store')
      .json({ email: 'guest@example.com', roleId: null })
      .headers(acme.headers)
      .loginAs(owner);

    const fromGlobex = await client
      .visit('access.invitations.index')
      .headers(globex.headers)
      .loginAs(globexOwner);

    assert.lengthOf(fromGlobex.body().data, 0);

    const revoke = await client
      .visit('access.invitations.destroy', { id: created.body().data.id })
      .headers(globex.headers)
      .loginAs(globexOwner);

    revoke.assertStatus(404);
  });

  test('records sending, revoking and accepting, with the email and role at the time', async ({
    client,
    assert,
  }) => {
    using fake = mail.fake();
    const { acme, owner } = await ownedWorkspace();
    const editor = await acme.role('Editor', ['roles.manage']);
    const guest = await createUser();
    await guest.merge({ email: 'guest@example.com' }).save();

    const invite = () =>
      client
        .visit('access.invitations.store')
        .json({ email: 'guest@example.com', roleId: editor.id })
        .headers(acme.headers)
        .loginAs(owner);

    const first = await invite();
    await client
      .visit('access.invitations.destroy', { id: first.body().data.id })
      .headers(acme.headers)
      .loginAs(owner);
    await invite();
    await client
      .visit('invitation_accept.store')
      .json({ token: linkToken(fake, 'invitations') })
      .loginAs(guest);

    const events = await AuditEvent.query()
      .where('tenant_id', acme.tenant.id)
      .orderBy('id');
    const invitation = {
      email: 'guest@example.com',
      role: { id: editor.id, name: 'Editor' },
    };

    assert.deepEqual(
      events.map((event) => [event.type, event.actorId, event.data]),
      [
        ['invitation.sent', owner.id, invitation],
        ['invitation.revoked', owner.id, invitation],
        ['invitation.sent', owner.id, invitation],
        [
          'member.joined',
          guest.id,
          {
            member: { email: 'guest@example.com', fullName: null },
            role: invitation.role,
          },
        ],
        ['invitation.accepted', guest.id, invitation],
      ]
    );
  });
});
