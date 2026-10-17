import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import drive from '@adonisjs/drive/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import AuditEvent from '#core/models/audit_event'
import Attachment from '#attachments/models/attachment'
import PruneAttachments from '#attachments/actions/prune_attachments'
import { AttachmentFactory } from '#attachments/database/factories/attachment_factory'

const twoDaysAgo = () => DateTime.now().minus({ days: 2 })

test.group('Attachments | prune', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('deletes an old unreferenced attachment with its file', async ({ assert }) => {
    using fakeDisk = drive.fake()
    const attachment = await AttachmentFactory.merge({ createdAt: twoDaysAgo() }).create()
    await fakeDisk.put(attachment.key, 'contents')

    assert.equal(await new PruneAttachments().handle(), 1)
    assert.isNull(await Attachment.find(attachment.id))
    fakeDisk.assertMissing(attachment.key)
  })

  // Regression: files vanish with no trace on the trail, or every idle run adds an event.
  test('records one system event for a run that deletes, none for one that doesn’t', async ({
    assert,
  }) => {
    using fakeDisk = drive.fake()
    const attachment = await AttachmentFactory.merge({ createdAt: twoDaysAgo() }).create()
    await fakeDisk.put(attachment.key, 'contents')

    await new PruneAttachments().handle()
    await new PruneAttachments().handle()

    const events = await AuditEvent.query().where('type', 'attachment.pruned')
    assert.deepEqual(
      events.map(event => [event.tenantId, event.actorId, event.subjectId, event.data]),
      [[null, null, null, { count: 1 }]],
    )
  })

  test('keeps an old attachment a foreign key references', async ({ assert }) => {
    using fakeDisk = drive.fake()
    await db.rawQuery(
      'CREATE TABLE prune_consumers (file_attachment_id uuid REFERENCES attachments (id))',
    )
    const attachment = await AttachmentFactory.merge({ createdAt: twoDaysAgo() }).create()
    await fakeDisk.put(attachment.key, 'contents')
    await db.table('prune_consumers').insert({ file_attachment_id: attachment.id })

    assert.equal(await new PruneAttachments().handle(), 0)
    assert.isNotNull(await Attachment.find(attachment.id))
    fakeDisk.assertExists(attachment.key)
  })

  test('keeps a fresh unreferenced upload until its consumer claims it', async ({ assert }) => {
    using fakeDisk = drive.fake()
    const attachment = await AttachmentFactory.create()
    await fakeDisk.put(attachment.key, 'contents')

    assert.equal(await new PruneAttachments().handle(), 0)
    assert.isNotNull(await Attachment.find(attachment.id))
    fakeDisk.assertExists(attachment.key)
  })
})
