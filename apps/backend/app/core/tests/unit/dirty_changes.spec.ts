import { test } from '@japa/runner';

import { dirtyChanges } from '#core/audit/main';
import AuditEvent from '#core/models/audit_event';

// Regression: a diff leaks a column the action didn't name, or reports one that didn't change.
test.group('Core | dirtyChanges', () => {
  test('reports only the named keys that changed, with their before and after', ({
    assert,
  }) => {
    const row = AuditEvent.$createFromAdapterResult({
      type: 'role.updated',
      subject_type: 'role',
      ip: '127.0.0.1',
    });

    if (row === null) {
      throw new Error('expected a row from the adapter result');
    }

    row.merge({ type: 'role.deleted', ip: '10.0.0.1' });

    assert.deepEqual(dirtyChanges(row, ['type', 'subjectType']), {
      type: { from: 'role.updated', to: 'role.deleted' },
    });
  });
});
