import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#audit/types/audit'

const BATCH_SIZE = 1000

export interface PruneAuditEventsInput {
  retentionDays: number
}

/**
 * Deletes the events older than the retention, in batches, then records how many it deleted.
 * Safe to run twice, concurrently, or after a crash: a run skips the rows another one has
 * locked, and a second run finds nothing left to delete, so it records nothing.
 */
export default class PruneAuditEvents {
  async handle({ retentionDays }: PruneAuditEventsInput) {
    const before = DateTime.now().minus({ days: retentionDays })
    let deleted = 0

    while (true) {
      // Ids are uuidv7, so walking the primary key from the oldest reaches old rows first.
      const { rowCount } = await db.rawQuery<{ rowCount: number }>(
        `
        DELETE FROM audit_events WHERE id IN (
          SELECT id FROM audit_events WHERE created_at < :before
          ORDER BY id LIMIT :limit FOR UPDATE SKIP LOCKED
        )
        `,
        { before: before.toJSDate(), limit: BATCH_SIZE },
      )

      deleted += rowCount

      if (rowCount < BATCH_SIZE) break
    }

    if (deleted > 0) {
      await audit.note('audit.pruned', {
        tenantId: null,
        subject: null,
        data: { count: deleted, before: before.toISO()! },
      })
    }

    return deleted
  }
}
