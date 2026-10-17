import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'
import PruneAuditEvents from '#audit/actions/prune_audit_events'

const daysAgo = (days: number) => DateTime.now().minus({ days })

function seed(type: string, createdAt: DateTime) {
  return AuditEvent.create({ tenantId: null, type, data: {}, createdAt })
}

test.group('Audit | prune', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: the trail grows forever, or the prune eats events still inside the retention.
  test('deletes the events older than the retention and keeps the rest', async ({ assert }) => {
    await seed('auth.logged_in', daysAgo(40))
    await seed('auth.logged_out', daysAgo(31))
    await seed('auth.signed_up', daysAgo(29))

    assert.equal(await new PruneAuditEvents().handle({ retentionDays: 30 }), 2)

    const left = await AuditEvent.query().orderBy('id')
    assert.deepEqual(
      left.map(event => event.type),
      ['auth.signed_up', 'audit.pruned'],
    )
  })

  // Regression: a run leaves no trace of what it deleted, or a run that deletes nothing (a second
  // run, a concurrent one) adds an event anyway.
  test('records one system event for a run that deletes, none for one that doesn’t', async ({
    assert,
  }) => {
    await seed('auth.logged_in', daysAgo(40))

    await new PruneAuditEvents().handle({ retentionDays: 30 })
    await new PruneAuditEvents().handle({ retentionDays: 30 })

    const pruned = await AuditEvent.query().where('type', 'audit.pruned')
    assert.lengthOf(pruned, 1)
    assert.deepInclude(pruned[0]?.toJSON(), { tenantId: null, actorId: null, subjectId: null })
    assert.equal(pruned[0]?.data.count, 1)
    assert.isString(pruned[0]?.data.before)
  })
})
