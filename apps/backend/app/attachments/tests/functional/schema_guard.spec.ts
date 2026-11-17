import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';

/**
 * attachments:prune deletes every attachment no foreign key references. A
 * consumer column without a real FK, or with a cascading one, would lose its
 * files silently, so the naming convention is enforced against the live schema.
 */
test('every *_attachment_id column has a single-column NO ACTION or RESTRICT FK to attachments', async ({
  assert,
}) => {
  const { rows } = await db.rawQuery<{
    rows: { column: string; problem: string | null }[];
  }>(`
    SELECT col.table_name || '.' || col.column_name AS column,
      CASE
        WHEN fk.conname IS NULL THEN 'no single-column foreign key to attachments(id)'
        WHEN fk.confdeltype NOT IN ('a', 'r') THEN 'ON DELETE must be NO ACTION or RESTRICT'
      END AS problem
    FROM information_schema.columns col
    LEFT JOIN pg_attribute att
      ON att.attrelid = (quote_ident(col.table_schema) || '.' || quote_ident(col.table_name))::regclass
      AND att.attname = col.column_name
    LEFT JOIN pg_constraint fk
      ON fk.contype = 'f'
      AND fk.conrelid = att.attrelid
      AND fk.conkey = ARRAY[att.attnum]
      AND fk.confrelid = 'attachments'::regclass
    WHERE col.table_schema = current_schema()
      AND col.table_name <> 'attachments'
      AND col.column_name LIKE '%attachment_id'
  `);

  assert.isAbove(
    rows.length,
    0,
    'no *_attachment_id column found: the guard is checking nothing'
  );
  assert.deepEqual(
    rows.filter((row) => row.problem !== null),
    []
  );
});
