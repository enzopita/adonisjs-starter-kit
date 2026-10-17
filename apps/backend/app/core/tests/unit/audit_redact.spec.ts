import { test } from '@japa/runner'
import { redact } from '#core/audit/redact'

// Regression: a password, token or hash reaches audit_events.data.
test.group('Core | audit redact', () => {
  test('replaces secret-named keys at any depth, in either spelling', ({ assert }) => {
    const stored = redact({
      email: 'ana@example.com',
      password: 'hunter22',
      invitation: { tokenHash: 'abc', token_hash: 'abc', role: { name: 'Editor', secret: 's' } },
      tokens: [{ token: 't', hash: 'h', name: 'cli' }],
    })

    assert.deepEqual(stored, {
      email: 'ana@example.com',
      password: '[redacted]',
      invitation: {
        tokenHash: '[redacted]',
        token_hash: '[redacted]',
        role: { name: 'Editor', secret: '[redacted]' },
      },
      tokens: [{ token: '[redacted]', hash: '[redacted]', name: 'cli' }],
    })
  })
})
