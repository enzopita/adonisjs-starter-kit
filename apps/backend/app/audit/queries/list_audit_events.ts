import type { DateTime } from 'luxon'
import User from '#users/models/user'
import AuditEvent from '#core/models/audit_event'

export interface ListAuditEventsInput {
  tenantId: string
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
}

/** AuditEvent isn't tenant-scoped (see #core/models/audit_event), so tenant_id is filtered here. */
export default class ListAuditEvents {
  async handle(input: ListAuditEventsInput) {
    const { tenantId, types, actorId, subjectType, subjectId, from, to } = input
    const query = AuditEvent.query().where('tenant_id', tenantId)

    if (types) query.whereIn('type', types)

    if (actorId) query.where('actor_id', actorId)

    if (subjectType) query.where('subject_type', subjectType)

    if (subjectId) query.where('subject_id', subjectId)

    if (from) query.where('created_at', '>=', from.toJSDate())

    if (to) query.where('created_at', '<=', to.toJSDate())

    const events = await query.orderBy('id', 'desc').paginate(input.page, input.perPage)

    const actorIds = [...new Set(events.all().flatMap(event => event.actorId ?? []))]
    const actors = await User.query().whereIn('id', actorIds).preload('avatar')
    const actorById = new Map(actors.map(actor => [actor.id, actor]))

    const rows: AuditEventRow[] = events.all().map(event => ({
      event,
      actor: (event.actorId && actorById.get(event.actorId)) || null,
    }))

    return { rows, meta: events.getMeta() }
  }
}
