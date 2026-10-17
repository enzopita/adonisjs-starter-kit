import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import { audit } from '#core/audit/main'
import drive from '@adonisjs/drive/services/main'
import type {} from '#attachments/types/audit'
import Attachment from '#attachments/models/attachment'

const BATCH_SIZE = 100

interface AttachmentReference {
  table: string
  column: string
}

/**
 * Deletes attachments older than a day that no foreign key references, row
 * and object. The references are read from the Postgres catalog on every run,
 * so a new consumer is covered by its migration alone. Safe to run twice,
 * concurrently, or after a crash: each row is deleted in its own transaction,
 * and a row whose object delete failed is simply found again next run. A run
 * that deleted some records one system event with the count.
 */
export default class PruneAttachments {
  async handle() {
    const references = await findReferences()
    let deleted = 0
    let after: string | undefined

    while (true) {
      const query = Attachment.query()
        .whereRaw(`created_at < now() - interval '24 hours'`)
        .orderBy('id')
        .limit(BATCH_SIZE)

      if (after) query.where('id', '>', after)

      for (const { table, column } of references) {
        query.whereNotExists(subquery =>
          subquery.from(table).whereColumn(`${table}.${column}`, 'attachments.id'),
        )
      }

      const candidates = await query

      for (const candidate of candidates) {
        if (await pruneOne(candidate.id)) deleted++
      }

      if (candidates.length < BATCH_SIZE) break

      after = candidates.at(-1)?.id
    }

    if (deleted > 0) {
      await audit.note('attachment.pruned', {
        tenantId: null,
        subject: null,
        data: { count: deleted },
      })
    }

    return deleted
  }
}

async function findReferences(): Promise<AttachmentReference[]> {
  const { rows } = await db.rawQuery<{
    rows: { table: string; column: string; columns: number; constraint: string }[]
  }>(`
    SELECT cl.relname AS table, att.attname AS column,
           cardinality(c.conkey) AS columns, c.conname AS constraint
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND c.confrelid = 'attachments'::regclass
  `)

  return rows.map(row => {
    if (row.columns !== 1) {
      throw new Error(`Foreign key ${row.constraint} into attachments spans several columns`)
    }

    return { table: row.table, column: row.column }
  })
}

async function pruneOne(id: string) {
  const trx = await db.transaction()

  try {
    const attachment = await Attachment.query({ client: trx })
      .where('id', id)
      .forUpdate()
      .skipLocked()
      .first()

    if (!attachment) {
      await trx.rollback()

      return false
    }

    await attachment.delete()
    await drive.use().delete(attachment.key)
    await trx.commit()

    return true
  } catch (error) {
    await trx.rollback()

    // 23503: foreign_key_violation, a record started referencing it after selection.
    if (error instanceof Error && 'code' in error && error.code === '23503') {
      logger.info({ attachmentId: id }, 'attachment referenced since selection, kept')

      return false
    }

    throw error
  }
}
