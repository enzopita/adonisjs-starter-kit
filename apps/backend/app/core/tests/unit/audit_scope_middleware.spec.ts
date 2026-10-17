import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { audit } from '#core/audit/main'
import testUtils from '@adonisjs/core/services/test_utils'
import AuditScopeMiddleware from '#core/middleware/audit_scope_middleware'
import UnauditedWriteException from '#core/exceptions/unaudited_write_exception'

type Request = { method: string; status: number; records: boolean }

async function handle({ method, status, records }: Request) {
  const ctx = await testUtils.createHttpContext()
  ctx.request.request.method = method
  ctx.auth = (await app.container.make('auth.manager')).createAuthenticator(ctx)

  await new AuditScopeMiddleware().handle(ctx, async () => {
    if (records) {
      await audit.note('auth.login_failed', {
        tenantId: null,
        subject: null,
        data: { email: 'ada@example.com' },
      })
    }

    ctx.response.status(status)
  })
}

// Regression: a new write endpoint ships without recording an audit event.
test.group('Core | audit scope middleware', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('fails a write that succeeded without recording an event', async ({ assert }) => {
    await assert.rejects(
      () => handle({ method: 'POST', status: 201, records: false }),
      UnauditedWriteException,
    )
  })

  test('lets through reads, refused writes, and writes that recorded', async () => {
    await handle({ method: 'GET', status: 200, records: false })
    await handle({ method: 'DELETE', status: 409, records: false })
    await handle({ method: 'PUT', status: 200, records: true })
  })
})
