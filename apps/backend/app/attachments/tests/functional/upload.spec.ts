import { test } from '@japa/runner'
import { PNG_BYTES } from '#tests/files'
import drive from '@adonisjs/drive/services/main'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import AuditEvent from '#core/models/audit_event'
import Attachment from '#attachments/models/attachment'

/** Through the API: attachments may not import the users module. */
async function signUp(client: ApiClient, email: string) {
  const response = await client
    .post('/api/v1/auth/signup')
    .json({ fullName: null, email, password: 'password123', passwordConfirmation: 'password123' })

  const { user, token } = response.body().data

  return { id: user.id, authorization: `Bearer ${token}` }
}

test.group('Attachments | upload', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('rejects a guest', async ({ client }) => {
    const response = await client
      .post('/api/v1/attachments')
      .file('file', PNG_BYTES, { filename: 'a.png' })

    response.assertStatus(401)
  })

  test('rejects a type outside the registry', async ({ client, assert }) => {
    using fakeDisk = drive.fake()
    const user = await signUp(client, 'svg@example.com')

    const response = await client
      .post('/api/v1/attachments')
      .file('file', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), {
        filename: 'x.svg',
      })
      .header('authorization', user.authorization)

    response.assertStatus(422)
    assert.lengthOf(await Attachment.all(), 0)
    fakeDisk.assertMissing('attachments')
  })

  test('stores a png under its id and returns a signed url', async ({ client, assert }) => {
    using fakeDisk = drive.fake()
    const user = await signUp(client, 'png@example.com')

    const response = await client
      .post('/api/v1/attachments')
      .file('file', PNG_BYTES, { filename: '../../etc/a\u0007vatar.png' })
      .header('authorization', user.authorization)

    response.assertStatus(200)
    const { data } = response.body()
    const attachment = await Attachment.findOrFail(data.id)

    assert.equal(attachment.uploaderId, user.id)
    assert.equal(data.name, 'avatar.png')
    assert.equal(data.mimeType, 'image/png')
    assert.isString(data.url)
    fakeDisk.assertExists(`attachments/${data.id}`)
  })

  test('records the upload, attributed to the uploader', async ({ client, assert }) => {
    using _fakeDisk = drive.fake()
    const user = await signUp(client, 'audit@example.com')

    const response = await client
      .post('/api/v1/attachments')
      .file('file', PNG_BYTES, { filename: 'avatar.png' })
      .header('authorization', user.authorization)

    const event = await AuditEvent.findByOrFail('type', 'attachment.uploaded')
    assert.deepInclude(event.toJSON(), {
      actorId: user.id,
      subjectId: response.body().data.id,
      data: { name: 'avatar.png', size: PNG_BYTES.length },
    })
  })
})
