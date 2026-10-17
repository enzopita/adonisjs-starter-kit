import type { HttpContext } from '@adonisjs/core/http'
import AuditEvent from '#core/models/audit_event'
import { redact } from '#core/audit/redact'
import type { LucidRow } from '@adonisjs/lucid/types/model'
import { currentAuditScope } from '#core/audit/scope'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { AuditEntry, AuditEventType, Changes } from '#core/audit/types'

function originOf(ctx: HttpContext | undefined) {
  if (!ctx) {
    return {
      actorId: null,
      impersonatorId: null,
      sessionId: null,
      requestId: null,
      ip: null,
      userAgent: null,
    }
  }

  const user = ctx.auth.user
  const token = user?.currentAccessToken

  return {
    actorId: user?.id ?? null,
    impersonatorId: token?.impersonatorId ?? null,
    sessionId: token ? String(token.identifier) : null,
    requestId: ctx.request.id() ?? null,
    ip: ctx.request.ip(),
    userAgent: ctx.request.header('user-agent')?.slice(0, 512) ?? null,
  }
}

async function insert<T extends AuditEventType>(
  type: T,
  entry: AuditEntry<T>,
  trx?: TransactionClientContract,
) {
  const scope = currentAuditScope()
  const origin = originOf(scope?.ctx)

  const attributes = {
    ...origin,
    actorId: entry.actorId ?? origin.actorId,
    sessionId: entry.sessionId ?? origin.sessionId,
    tenantId: entry.tenantId,
    type,
    subjectType: entry.subject?.type ?? null,
    subjectId: entry.subject?.id ?? null,
    data: redact(entry.data),
  }

  await AuditEvent.create(attributes, { client: trx })

  if (scope) scope.recorded += 1
}

export const audit = {
  /** Inserts the event in `trx`, so it commits or rolls back with the write it describes. */
  async record<T extends AuditEventType>(
    trx: TransactionClientContract,
    type: T,
    entry: AuditEntry<T>,
  ) {
    await insert(type, entry, trx)
  },

  /** Only for an event with no Lucid write of its own to share a transaction with: login, logout. */
  async note<T extends AuditEventType>(type: T, entry: AuditEntry<T>) {
    await insert(type, entry)
  },
}

/** Call before save(), which empties `$dirty`. Keys left out of `keys` never appear. */
export function dirtyChanges<Row extends LucidRow, K extends keyof Row & string>(
  row: Row,
  keys: readonly K[],
): Changes<Row, K> {
  const changes: Changes<Row, K> = {}

  for (const key of keys) {
    if (key in row.$dirty) changes[key] = { from: row.$original[key], to: row[key] }
  }

  return changes
}
