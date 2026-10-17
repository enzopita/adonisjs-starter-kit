import { test } from '@japa/runner'
import Role from '#access/models/role'
import db from '@adonisjs/lucid/services/db'
import { createUser, workspace } from '#access/tests/seed'
import emitter from '@adonisjs/core/services/emitter'
import AuditEvent from '#core/models/audit_event'
import RoleAssignment from '#access/models/role_assignment'
import testUtils from '@adonisjs/core/services/test_utils'
import GrantAuditViewToOwnerRoles from '#database/migrations/1792264036535_grant_audit_view_to_owner_roles'

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

  // Regression: an Owner role from before audit.view keeps a trail its holders can't open, the
  // grant reaches a role that isn't an Owner, or a second run grants or records it again.
  test('grants audit.view to the Owner roles that predate it, once, as the system', async ({
    assert,
  }) => {
    const acme = await workspace()
    const owner = await acme.role('Owner', ['roles.manage', 'members.manage'])
    const manager = await acme.role('Manager', ['members.manage'])
    const auditor = await acme.role('Auditor', ['roles.manage', 'members.manage', 'audit.view'])

    for (let run = 0; run < 2; run++) {
      await new GrantAuditViewToOwnerRoles(db.connection(), 'grant', false).execUp()
    }

    const roles = await acme.inside(() => Role.query().orderBy('name'))
    const events = await AuditEvent.query().where('tenant_id', acme.tenant.id)

    assert.deepEqual(
      roles.map(role => [role.name, role.permissions]),
      [
        ['Auditor', auditor.permissions],
        ['Manager', manager.permissions],
        ['Owner', ['roles.manage', 'members.manage', 'audit.view']],
      ],
    )
    assert.deepEqual(
      events.map(row => [row.type, row.actorId, row.subjectId, row.data]),
      [
        [
          'role.updated',
          null,
          owner.id,
          {
            name: 'Owner',
            changes: {
              permissions: {
                from: ['roles.manage', 'members.manage'],
                to: ['roles.manage', 'members.manage', 'audit.view'],
              },
            },
          },
        ],
      ],
    )
  })
})
