import { test } from '@japa/runner'
import Role from '#access/models/role'
import { createUser, workspace } from '#access/tests/seed'
import emitter from '@adonisjs/core/services/emitter'
import AuditEvent from '#core/models/audit_event'
import RoleAssignment from '#access/models/role_assignment'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Access | tenant owner', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('makes the creator of a tenant its Owner, once', async ({ client, assert }) => {
    const acme = await workspace()
    const founder = await acme.member()
    const event = { tenantId: acme.tenant.id, creatorId: founder.id, locale: 'en-US' }

    await emitter.emit('tenancy:tenant_created', event)
    await emitter.emit('tenancy:tenant_created', event)

    const response = await client
      .visit('access.my_permissions.show')
      .headers(acme.headers)
      .loginAs(founder)

    assert.deepEqual(response.body().data.permissions, [
      'roles.manage',
      'members.manage',
      'audit.view',
    ])
    assert.lengthOf(await acme.inside(() => Role.all()), 1)
    assert.lengthOf(await acme.inside(() => RoleAssignment.all()), 1)
  })

  test('assigns an Owner role left by an interrupted run', async ({ assert }) => {
    const acme = await workspace()
    const founder = await acme.member()
    const owner = await acme.role('Owner', ['roles.manage', 'members.manage'])

    await emitter.emit('tenancy:tenant_created', {
      tenantId: acme.tenant.id,
      creatorId: founder.id,
      locale: 'en-US',
    })

    const assignment = await acme.inside(() =>
      RoleAssignment.query().where('user_id', founder.id).firstOrFail(),
    )

    assert.equal(assignment.roleId, owner.id)
  })

  test('names the Owner role in the creator’s locale', async ({ client, assert }) => {
    const founder = await createUser()

    const created = await client
      .visit('tenants.tenants.store')
      .header('accept-language', 'pt-BR')
      .json({ name: 'Acme' })
      .loginAs(founder)

    const roles = await client
      .visit('access.roles.index')
      .headers({ 'X-Tenant-Id': created.body().data.id })
      .loginAs(founder)

    assert.deepEqual(
      roles.body().data.map((role: { name: string }) => role.name),
      ['Proprietário'],
    )
  })

  test('records the Owner role and its assignment only when it creates them', async ({
    assert,
  }) => {
    const acme = await workspace()
    const founder = await acme.member()
    const event = { tenantId: acme.tenant.id, creatorId: founder.id, locale: 'en-US' }

    await emitter.emit('tenancy:tenant_created', event)
    await emitter.emit('tenancy:tenant_created', event)

    const events = await AuditEvent.query().where('tenant_id', acme.tenant.id).orderBy('id')

    assert.deepEqual(
      events.map(row => [row.type, row.actorId, row.subjectType]),
      [
        ['role.created', null, 'role'],
        ['member.role_changed', null, 'member'],
      ],
    )
  })
})
