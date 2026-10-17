import { test } from '@japa/runner'
import User from '#users/models/user'
import Tenant from '#tenancy/models/tenant'
import AuditEvent from '#core/models/audit_event'
import emitter from '@adonisjs/core/services/emitter'
import testUtils from '@adonisjs/core/services/test_utils'
import TenantMembership from '#tenancy/models/tenant_membership'

test.group('Tenancy | tenants', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('lists only the tenants the user belongs to', async ({ client, assert }) => {
    const user = await User.create({ email: 'user@example.com', password: 'password123' })
    const globex = await Tenant.create({ name: 'Globex' })
    const acme = await Tenant.create({ name: 'Acme' })
    const initech = await Tenant.create({ name: 'Initech' })
    const other = await User.create({ email: 'other@example.com', password: 'password123' })
    await TenantMembership.createMany([
      { tenantId: globex.id, userId: user.id },
      { tenantId: acme.id, userId: user.id },
      { tenantId: initech.id, userId: other.id },
    ])

    const response = await client.visit('tenants.tenants.index').loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map(tenant => tenant.name),
      ['Acme', 'Globex'],
    )
  })

  test('creates a tenant with its creator as a member', async ({ client, assert }) => {
    using events = emitter.fake(['tenancy:tenant_created'])
    const user = await User.create({ email: 'founder@example.com', password: 'password123' })

    const response = await client
      .visit('tenants.tenants.store')
      .json({ name: 'Acme' })
      .loginAs(user)

    response.assertStatus(200)
    assert.equal(response.body().data.name, 'Acme')

    const membership = await TenantMembership.query()
      .where('tenant_id', response.body().data.id)
      .where('user_id', user.id)
      .first()

    assert.isNotNull(membership)
    events.assertEmitted(
      'tenancy:tenant_created',
      ({ data }) => data.tenantId === response.body().data.id && data.creatorId === user.id,
    )
  })

  test('records the creation in the new tenant, attributed to its creator', async ({
    client,
    assert,
  }) => {
    using _events = emitter.fake(['tenancy:tenant_created'])
    const user = await User.create({ email: 'founder@example.com', password: 'password123' })

    const response = await client
      .visit('tenants.tenants.store')
      .json({ name: 'Acme' })
      .loginAs(user)

    const tenantId = response.body().data.id
    const event = await AuditEvent.findByOrFail('type', 'tenant.created')
    assert.deepInclude(event.toJSON(), {
      tenantId,
      actorId: user.id,
      subjectId: tenantId,
      data: { name: 'Acme' },
    })
  })
})
