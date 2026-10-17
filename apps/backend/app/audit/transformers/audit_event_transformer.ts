import { BaseTransformer } from '@adonisjs/core/transformers'
import type { AuditEventRow } from '#audit/queries/list_audit_events'
import type {} from '#access/types/audit'
import type {} from '#tenancy/types/audit'
import UserTransformer from '#users/transformers/user_transformer'
import type { DataOf, SubjectOf, TenantEventType } from '#core/audit/types'

/** One variant per event type, so the frontend narrows `data` and `subject` by switching on `type`. */
type TenantEventVariant = {
  [T in TenantEventType]: { type: T; subject: SubjectOf<T>; data: DataOf<T> }
}[TenantEventType]

export default class AuditEventTransformer extends BaseTransformer<AuditEventRow> {
  toObject() {
    const { event, actor } = this.resource

    return {
      id: event.id,
      createdAt: event.createdAt,
      // Depth 2: actor -> avatar. A top-level paginator's own depth() doesn't reach the
      // inferred response type, so the item carries it.
      actor: actor ? UserTransformer.transform(actor).depth(2) : null,
      session: {
        id: event.sessionId,
        ip: event.ip,
        userAgent: event.userAgent,
        requestId: event.requestId,
      },
      // Nested: the inferred response type keeps a union inside a field, not at the top level.
      // SAFETY: audit.record() writes type, subject and data together from one AuditEvents
      // entry, and the trail lists a tenant's events only.
      event: {
        type: event.type,
        subject: event.subjectId ? { type: event.subjectType, id: event.subjectId } : null,
        data: event.data,
      } as TenantEventVariant,
    }
  }
}
