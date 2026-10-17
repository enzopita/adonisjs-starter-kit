import { z } from 'zod'
import { AUDIT_AREAS, AUDIT_EVENT_TYPES, areaOf } from '@/features/audit/event-text'
import type { AuditSubject } from '@/features/audit/event-text'
import { queries, tenantHeaders } from '@/features/core/api'

const PER_PAGE = 20

/** For a trail embedded in a card or a dialog, where 20 rows push the pagination out of reach. */
export const EMBEDDED_PER_PAGE = 10

export const accountActivityQuery = (page: number) =>
  queries.audit.accountActivity.index.queryOptions({ query: { page, perPage: EMBEDDED_PER_PAGE } })

/**
 * The audit page's filters, as its URL holds them. `event` is an area (`role`) or one event type
 * (`role.updated`); `from` and `to` are calendar days in the viewer's time zone. A value that
 * doesn't parse is dropped rather than failing the page.
 */
export const auditSearchSchema = z.object({
  page: z.number().int().min(1).optional().catch(undefined),
  event: z
    .enum([...AUDIT_AREAS, ...AUDIT_EVENT_TYPES])
    .optional()
    .catch(undefined),
  actor: z.uuid().optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
})

export type AuditSearch = z.infer<typeof auditSearchSchema>

export type AuditFilters = AuditSearch & { subject?: AuditSubject; perPage?: number }

function eventTypes(event: NonNullable<AuditSearch['event']>) {
  return event.includes('.') ? [event] : AUDIT_EVENT_TYPES.filter(type => areaOf(type) === event)
}

/** A local calendar day's first or last instant, as the API's ISO 8601 bound. */
function dayBound(day: string, edge: 'start' | 'end') {
  return new Date(`${day}T${edge === 'start' ? '00:00:00.000' : '23:59:59.999'}`).toISOString()
}

export const auditEventsQuery = (tenantId: string, filters: AuditFilters) =>
  queries.audit.auditEvents.index.queryOptions({
    query: {
      page: filters.page,
      perPage: filters.perPage ?? PER_PAGE,
      type: filters.event && eventTypes(filters.event),
      actorId: filters.actor,
      subjectType: filters.subject?.type,
      subjectId: filters.subject?.id,
      from: filters.from && dayBound(filters.from, 'start'),
      to: filters.to && dayBound(filters.to, 'end'),
    },
    ...tenantHeaders(tenantId),
  })
