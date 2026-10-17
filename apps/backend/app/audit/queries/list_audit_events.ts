import type { DateTime } from 'luxon'
import User from '#users/models/user'
import AuditEvent from '#core/models/audit_event'

/** A tenant's events, or a user's own account events (sign-in, avatar), which have no tenant. */
export type AuditTrail = { tenantId: string } | { accountOf: string }

export interface ListAuditEventsInput {
  trail: AuditTrail
  page: number
  perPage: number
  types?: string[]
  actorId?: string
  subjectType?: string
  subjectId?: string
  from?: DateTime
  to?: DateTime
}

export interface AuditEventRow {
  event: AuditEvent
  /** Null for an event with no signed-in actor (a seed, the repl) or whose user is gone. */
  actor: User | null
  /** The platform admin who acted as `actor`, when the event happened while impersonating. */
  impersonator: User | null
}

function queryTrail(trail: AuditTrail) {
  if ('tenantId' in trail) return AuditEvent.query().where('tenant_id', trail.tenantId)

  return AuditEvent.query()
    .whereNull('tenant_id')
    .where(own =>
      own
        .where('actor_id', trail.accountOf)
        .orWhere(subject =>
          subject.where('subject_type', 'user').where('subject_id', trail.accountOf),
        ),
    )
}

/** AuditEvent isn't tenant-scoped (see #core/models/audit_event), so tenant_id is filtered here. */
export default class ListAuditEvents {
  async handle(input: ListAuditEventsInput) {
    const { trail, types, actorId, subjectType, subjectId, from, to } = input
    const query = queryTrail(trail)

    if (types) query.whereIn('type', types)

    if (actorId) query.where('actor_id', actorId)

    if (subjectType) query.where('subject_type', subjectType)

    if (subjectId) query.where('subject_id', subjectId)

    if (from) query.where('created_at', '>=', from.toJSDate())

    if (to) query.where('created_at', '<=', to.toJSDate())

    const events = await query.orderBy('id', 'desc').paginate(input.page, input.perPage)

    const userIds = events
      .all()
      .flatMap(event => [event.actorId, event.impersonatorId])
      .filter(id => id !== null)

    const users = await User.query()
      .whereIn('id', [...new Set(userIds)])
      .preload('avatar')

    const userById = new Map(users.map(user => [user.id, user]))

    const rows: AuditEventRow[] = events.all().map(event => ({
      event,
      actor: (event.actorId && userById.get(event.actorId)) || null,
      impersonator: (event.impersonatorId && userById.get(event.impersonatorId)) || null,
    }))

    return { rows, meta: events.getMeta() }
  }
}
