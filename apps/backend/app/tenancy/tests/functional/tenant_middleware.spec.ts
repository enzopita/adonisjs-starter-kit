import { test } from '@japa/runner'
import User from '#users/models/user'
import { middleware } from '#start/kernel'
import Tenant from '#tenancy/models/tenant'
import AuditEvent from '#core/models/audit_event'
import router from '@adonisjs/core/services/router'
import testUtils from '@adonisjs/core/services/test_utils'
import { currentTenantContext } from '#tenancy/tenant_context'

/**
 * No product route needs a tenant yet, so the contract is exercised through a
 * route that only exists in this test process. It is registered on import,
 * before the suite starts the HTTP server and commits the router.
 */
router
  .get('/__tests/tenant-context', ({ tenant }) => ({
    tenantId: tenant.id,
    context: currentTenantContext(),
  }))
  .use([middleware.auth(), middleware.tenant()])

async function memberOf(tenant: Tenant, email: string) {
  const user = await User.create({ email, password: 'password123' })
  await tenant.related('memberships').create({ userId: user.id })

  return user
}

test.group('Tenancy | tenant middleware', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('rejects a missing or malformed X-Tenant-Id with 400', async ({ client }) => {
    const user = await User.create({ email: 'user@example.com', password: 'password123' })

    const missing = await client.get('/__tests/tenant-context').loginAs(user)
    missing.assertStatus(400)
    missing.assertBodyContains({ key: 'E_INVALID_TENANT_HEADER' })

    const malformed = await client
      .get('/__tests/tenant-context')
      .header('X-Tenant-Id', 'not-a-uuid')
      .loginAs(user)

    malformed.assertStatus(400)
  })

  test('answers 403 alike for a tenant of others and an unknown one', async ({
    client,
    assert,
  }) => {
    const acme = await Tenant.create({ name: 'Acme' })
    await memberOf(acme, 'member@example.com')
    const outsider = await User.create({ email: 'outsider@example.com', password: 'password123' })

    const foreign = await client
      .get('/__tests/tenant-context')
      .header('X-Tenant-Id', acme.id)
      .loginAs(outsider)

    const unknown = await client
      .get('/__tests/tenant-context')
      .header('X-Tenant-Id', '01900000-0000-7000-8000-000000000000')
      .loginAs(outsider)

    foreign.assertStatus(403)
    unknown.assertStatus(403)
    assert.deepEqual(foreign.body(), unknown.body())
  })

  // Regression: an outsider sending a tenant's id leaves no trace on its trail, or an unknown id
  // tries to record one (and fails on the foreign key).
  test('records a non-member’s attempt on the tenant, and nothing for an unknown one', async ({
    client,
    assert,
  }) => {
    const acme = await Tenant.create({ name: 'Acme' })
    const outsider = await User.create({ email: 'outsider@example.com', password: 'password123' })

    for (const tenantId of [acme.id, '01900000-0000-7000-8000-000000000000']) {
      await client.get('/__tests/tenant-context').header('X-Tenant-Id', tenantId).loginAs(outsider)
    }

    const events = await AuditEvent.query().where('type', 'access.tenant_denied')
    assert.deepEqual(
      events.map(event => [event.tenantId, event.actorId, event.data]),
      [[acme.id, outsider.id, { route: '/__tests/tenant-context', method: 'GET' }]],
    )
  })

  test('runs the request inside the tenant of a member', async ({ client }) => {
    const acme = await Tenant.create({ name: 'Acme' })
    const member = await memberOf(acme, 'member@example.com')

    const response = await client
      .get('/__tests/tenant-context')
      .header('X-Tenant-Id', acme.id)
      .loginAs(member)

    response.assertStatus(200)
    response.assertBody({ tenantId: acme.id, context: { kind: 'tenant', tenantId: acme.id } })
  })
})
