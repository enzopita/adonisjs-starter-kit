import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { audit } from '#core/audit/main';
import { currentAuditScope } from '#core/audit/scope';
import AuditExemptionMisusedException from '#core/exceptions/audit_exemption_misused_exception';
import UnauditedWriteException from '#core/exceptions/unaudited_write_exception';
import AuditScopeMiddleware from '#core/middleware/audit_scope_middleware';

type Request = {
  method: string;
  status: number;
  records: boolean;
  exempt?: 'unaudited' | 'unchanged';
};

async function handle({ method, status, records, exempt }: Request) {
  const ctx = await testUtils.createHttpContext();
  ctx.request.request.method = method;
  const auth = await app.container.make('auth.manager');
  ctx.auth = auth.createAuthenticator(ctx);

  await new AuditScopeMiddleware().handle(ctx, async () => {
    if (records) {
      await audit.note('auth.login_failed', {
        tenantId: null,
        subject: null,
        data: { email: 'ada@example.com' },
      });
    }

    const scope = currentAuditScope();

    if (scope === undefined) {
      throw new Error('expected an audit scope inside the middleware');
    }

    if (exempt === 'unaudited') {
      scope.unaudited = 'provider_callback';
    }

    if (exempt === 'unchanged') {
      audit.unchanged();
    }

    ctx.response.status(status);
  });
}

// Regression: a new write endpoint ships without recording an audit event.
test.group('Core | audit scope middleware', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('fails a write that succeeded without recording an event', async ({
    assert,
  }) => {
    await assert.rejects(
      () => handle({ method: 'POST', status: 201, records: false }),
      UnauditedWriteException
    );
  });

  test('lets through reads, refused writes, writes that recorded, and exempted writes', async () => {
    await handle({ method: 'GET', status: 200, records: false });
    await handle({ method: 'DELETE', status: 409, records: false });
    await handle({ method: 'PUT', status: 200, records: true });
    await handle({
      method: 'POST',
      status: 200,
      records: false,
      exempt: 'unaudited',
    });
    await handle({
      method: 'POST',
      status: 200,
      records: false,
      exempt: 'unchanged',
    });
  });

  test(
    'fails a write exempted as {exempt} that recorded an event anyway: the exemption is wrong'
  )
    .with([{ exempt: 'unaudited' }, { exempt: 'unchanged' }] as const)
    .run(async ({ assert }, { exempt }) => {
      await assert.rejects(
        () => handle({ method: 'POST', status: 200, records: true, exempt }),
        AuditExemptionMisusedException
      );
    });
});
