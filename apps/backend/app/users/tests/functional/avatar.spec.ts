import { test } from '@japa/runner'
import User from '#users/models/user'
import AuditEvent from '#core/models/audit_event'
import drive from '@adonisjs/drive/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { AttachmentFactory } from '#attachments/database/factories/attachment_factory'

test.group('Users | avatar', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('rejects an upload from another user', async ({ client }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const thief = await User.create({ email: 'thief@example.com', password: 'password123' })
    const attachment = await AttachmentFactory.merge({ uploaderId: owner.id }).create()

    const response = await client
      .put('/api/v1/account/avatar')
      .json({ attachmentId: attachment.id })
      .loginAs(thief)

    response.assertStatus(422)
    response.assertBodyContains({ code: 'E_INVALID_ATTACHMENT' })
  })

  test('rejects a type outside the avatar rule', async ({ client }) => {
    const user = await User.create({ email: 'pdf@example.com', password: 'password123' })

    const attachment = await AttachmentFactory.merge({
      uploaderId: user.id,
      name: 'cv.pdf',
      extname: 'pdf',
      mimeType: 'application/pdf',
    }).create()

    const response = await client
      .put('/api/v1/account/avatar')
      .json({ attachmentId: attachment.id })
      .loginAs(user)

    response.assertStatus(422)
  })

  test('sets an own png and shows it on the profile', async ({ client, assert }) => {
    using _fakeDisk = drive.fake()
    const user = await User.create({ email: 'png@example.com', password: 'password123' })
    const attachment = await AttachmentFactory.merge({ uploaderId: user.id }).create()

    const update = await client
      .put('/api/v1/account/avatar')
      .json({ attachmentId: attachment.id })
      .loginAs(user)

    update.assertStatus(200)
    assert.equal(update.body().data.avatar?.id, attachment.id)

    const profile = await client.get('/api/v1/account/profile').loginAs(user)

    profile.assertStatus(200)
    assert.equal(profile.body().data.avatar?.id, attachment.id)
    assert.isString(profile.body().data.avatar?.url)
  })

  test('clears the avatar with null', async ({ client, assert }) => {
    const user = await User.create({ email: 'clear@example.com', password: 'password123' })
    const attachment = await AttachmentFactory.merge({ uploaderId: user.id }).create()
    user.avatarAttachmentId = attachment.id
    await user.save()

    const response = await client
      .put('/api/v1/account/avatar')
      .json({ attachmentId: null })
      .loginAs(user)

    response.assertStatus(200)
    assert.isNull(response.body().data.avatar)
    await user.refresh()
    assert.isNull(user.avatarAttachmentId)
  })

  test('records the change with the avatar before and after', async ({ client, assert }) => {
    const user = await User.create({ email: 'audit@example.com', password: 'password123' })
    const attachment = await AttachmentFactory.merge({ uploaderId: user.id }).create()
    user.avatarAttachmentId = attachment.id
    await user.save()

    await client.put('/api/v1/account/avatar').json({ attachmentId: null }).loginAs(user)

    const event = await AuditEvent.findByOrFail('type', 'user.avatar_changed')
    assert.deepInclude(event.toJSON(), {
      actorId: user.id,
      subjectId: user.id,
      data: { changes: { avatarAttachmentId: { from: attachment.id, to: null } } },
    })
  })
})
