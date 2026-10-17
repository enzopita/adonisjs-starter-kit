/**
 * Every event the app records, one entry per type, declared by the module that records it in
 * its `types/audit.ts`, the way `EventsList` is:
 *
 *   declare module '#core/audit/types' {
 *     interface AuditEvents {
 *       'role.deleted': TenantEvent<'role', { name: string }>
 *     }
 *   }
 *
 * A file that records or lists events imports those declarations, `import type {} from
 * '#<module>/types/audit'`: another program that compiles the file, such as the frontend's
 * through the API registry, otherwise doesn't see them.
 */
export interface AuditEvents {}

export type AuditEventType = keyof AuditEvents

// Type aliases, not interfaces: @tuyau/core's response-type inference only recognizes plain
// object types (see app/access/permissions.ts).

/** Recorded in a tenant and listed on its audit screen. `S` is the subject's type, null for none. */
export type TenantEvent<S extends string | null, D> = { scope: 'tenant'; subject: S; data: D }

/** Recorded for a user outside any tenant: sign-up, login, their own avatar. */
export type AccountEvent<S extends string | null, D> = { scope: 'account'; subject: S; data: D }

/** Recorded by the app itself outside any tenant and account (a scheduled cleanup): no screen lists it. */
export type SystemEvent<D> = { scope: 'system'; subject: null; data: D }

type EventTypeIn<Scope> = {
  [T in AuditEventType]: AuditEvents[T] extends { scope: Scope } ? T : never
}[AuditEventType]

export type TenantEventType = EventTypeIn<'tenant'>

export type AccountEventType = EventTypeIn<'account'>

export type AuditSubject<S extends string = string> = { type: S; id: string }

export type TenantSubjectType = {
  [T in TenantEventType]: AuditEvents[T] extends { subject: infer S extends string } ? S : never
}[TenantEventType]

type SubjectFor<S> = S extends string ? AuditSubject<S> : null

/** An event declared with subject `'user' | null` takes a user subject or none. */
export type SubjectOf<T extends AuditEventType> = SubjectFor<AuditEvents[T]['subject']>

export type DataOf<T extends AuditEventType> = AuditEvents[T] extends { data: infer D } ? D : never

export type AuditEntry<T extends AuditEventType> = {
  tenantId: AuditEvents[T] extends { scope: 'tenant' } ? string : null
  subject: SubjectOf<T>
  /** Display values as they are now (names, emails), so the event still reads once they change. */
  data: DataOf<T>
  /** Login and sign-up only: the request had no signed-in user when it started. */
  actorId?: string
  sessionId?: string
}

export type Changes<Row, K extends keyof Row> = { [P in K]?: { from: Row[P]; to: Row[P] } }

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject

export type JsonObject = { [key: string]: JsonValue }
