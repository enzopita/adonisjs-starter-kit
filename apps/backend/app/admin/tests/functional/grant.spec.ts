import { test } from '@japa/runner'
import { createUser } from '#access/tests/seed'
import AuditEvent from '#core/models/audit_event'
import PlatformAdmin from '#access/models/platform_admin'
import testUtils from '@adonisjs/core/services/test_utils'
import GrantPlatformAdmin from '#admin/actions/grant_platform_admin'

test.group('Admin | grant', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: admin:grant fails or records again when run twice (the E2E setup reruns it), or
  // matches an email only in its stored case.
  test('makes a user a platform admin once, recorded once', async ({ assert }) => {
    const ada = await createUser()
    const grant = new GrantPlatformAdmin()

    const first = await grant.handle({ email: ada.email.toUpperCase() })
    const second = await grant.handle({ email: ada.email })
    const unknown = await grant.handle({ email: 'nobody@example.com' })

    assert.deepEqual([first?.granted, second?.granted, unknown], [true, false, null])
    assert.lengthOf(await PlatformAdmin.query().where('user_id', ada.id), 1)

    const events = await AuditEvent.query().where('type', 'admin.granted')
    assert.deepEqual(
      events.map(event => [event.actorId, event.data]),
      [[null, { email: ada.email }]],
    )
  })
})
