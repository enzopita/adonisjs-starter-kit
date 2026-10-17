import { test } from '@japa/runner'
import { workspace } from '#access/tests/seed'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'

const denials = () => AuditEvent.query().where('type', 'access.denied')

test.group('Access | denied access', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: a member probing what they can't do leaves no trace in the tenant's trail.
  test('records a refused check as access.denied on the tenant', async ({ client, assert }) => {
    const acme = await workspace()
    const plain = await acme.member()

    const response = await client.visit('access.roles.index').headers(acme.headers).loginAs(plain)

    response.assertStatus(403)
    const [denial, ...others] = await denials()
    assert.lengthOf(others, 0)
    assert.deepInclude(denial?.toJSON(), {
      tenantId: acme.tenant.id,
      actorId: plain.id,
      subjectId: null,
      data: { permission: 'roles.manage', route: '/api/v1/roles', method: 'GET' },
    })
  })

  // Regression: a screen that asks allows() to pick what it shows fills the trail with denials.
  test('records nothing for a check that only asks', async ({ client, assert }) => {
    const acme = await workspace()
    const roleManager = await acme.member()
    await acme.grant(roleManager, 'roles.manage')

    const response = await client
      .visit('audit.audit_events.index')
      .qs({ subjectType: 'role' })
      .headers(acme.headers)
      .loginAs(roleManager)

    response.assertStatus(200)
    assert.lengthOf(await denials(), 0)
  })
})
