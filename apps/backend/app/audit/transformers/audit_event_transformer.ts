import { BaseTransformer } from '@adonisjs/core/transformers';

import type {} from '#access/types/audit';
import type {} from '#admin/types/audit';
import type {} from '#attachments/types/audit';
import type { AuditEventRow } from '#audit/queries/list_audit_events';
import type {} from '#auth/types/audit';
import type {
  AccountEventType,
  AuditEventType,
  DataOf,
  SubjectOf,
  TenantEventType,
} from '#core/audit/types';
import type {} from '#tenancy/types/audit';
import UserTransformer from '#users/transformers/user_transformer';
import type {} from '#users/types/audit';

/** One variant per event type, so the frontend narrows `data` and `subject` by switching on `type`. */
type EventVariant<Types extends AuditEventType> = {
  [T in Types]: { type: T; subject: SubjectOf<T>; data: DataOf<T> };
}[Types];

export default class AuditEventTransformer extends BaseTransformer<AuditEventRow> {
  toObject() {
    return this.withEvent<EventVariant<TenantEventType>>();
  }

  forAccount() {
    return this.withEvent<EventVariant<AccountEventType>>();
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- the caller names the variant it returns; nothing passed in could carry it.
  private withEvent<Event>() {
    const { event, actor, impersonator } = this.resource;

    return {
      id: event.id,
      createdAt: event.createdAt,
      // Depth 2: actor -> avatar. A top-level paginator's own depth() doesn't reach the
      // inferred response type, so the item carries it.
      actor: actor ? UserTransformer.transform(actor).depth(2) : null,
      impersonator: impersonator
        ? UserTransformer.transform(impersonator).depth(2)
        : null,
      session: {
        id: event.sessionId,
        ip: event.ip,
        userAgent: event.userAgent,
        requestId: event.requestId,
      },
      // Nested: the inferred response type keeps a union inside a field, not at the top level.
      // SAFETY: audit.record() writes type, subject and data together from one AuditEvents
      // entry, and each variant's caller lists events of its scope only.
      event: {
        type: event.type,
        subject:
          event.subjectId === null
            ? null
            : { type: event.subjectType, id: event.subjectId },
        data: event.data,
      } as Event,
    };
  }
}
