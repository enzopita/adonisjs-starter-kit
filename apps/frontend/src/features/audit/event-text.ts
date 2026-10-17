import type { api } from '@/features/core/api'
import { t } from '@/features/core/i18n'

export type AuditEventRow = Awaited<ReturnType<typeof api.audit.auditEvents.index>>['data'][number]

export type AuditEvent = AuditEventRow['event']

export type AuditEventType = AuditEvent['type']

/** The part of an event type before its dot (`role` for `role.updated`), one filter group each. */
export type AuditArea = AuditEventType extends `${infer Area}.${string}` ? Area : never

export type AuditSubject = NonNullable<AuditEvent['subject']>

type EventMap = { [E in AuditEvent as E['type']]: E }

/** What a timeline row says after the actor's name, and the permissions the event added or removed. */
export type EventDescription = {
  sentence: string
  permissions?: { added: string[]; removed: string[] }
}

type EventText<T extends AuditEventType> = {
  label: string
  describe: (event: EventMap[T]) => EventDescription
}

type Snapshot = { email: string; fullName: string | null }

const displayName = (member: Snapshot) => member.fullName ?? member.email

function permissionChanges(from: readonly string[], to: readonly string[]) {
  return {
    added: to.filter(permission => !from.includes(permission)),
    removed: from.filter(permission => !to.includes(permission)),
  }
}

/** One entry per event type the API returns: a new backend type without one fails the typecheck. */
type EventTexts = { [T in AuditEventType]: EventText<T> }

const EVENTS: EventTexts = {
  'tenant.created': {
    label: t('audit.types.tenantCreated'),
    describe: ({ data }) => ({ sentence: t('audit.events.tenantCreated', { name: data.name }) }),
  },
  'role.created': {
    label: t('audit.types.roleCreated'),
    describe: ({ data }) => ({
      sentence: t('audit.events.roleCreated', { name: data.name }),
      permissions: permissionChanges([], data.permissions),
    }),
  },
  'role.updated': {
    label: t('audit.types.roleUpdated'),
    describe: ({ data: { name, changes } }) => ({
      sentence: changes.name
        ? t('audit.events.roleRenamed', { from: changes.name.from, to: changes.name.to })
        : t('audit.events.roleUpdated', { name }),
      permissions:
        changes.permissions && permissionChanges(changes.permissions.from, changes.permissions.to),
    }),
  },
  'role.deleted': {
    label: t('audit.types.roleDeleted'),
    describe: ({ data }) => ({ sentence: t('audit.events.roleDeleted', { name: data.name }) }),
  },
  'member.joined': {
    label: t('audit.types.memberJoined'),
    describe: ({ data: { role } }) => ({
      sentence: role
        ? t('audit.events.memberJoinedAs', { role: role.name })
        : t('audit.events.memberJoined'),
    }),
  },
  'member.role_changed': {
    label: t('audit.types.memberRoleChanged'),
    describe: ({ data: { member, from, to } }) => {
      const values = { member: displayName(member), from: from?.name ?? '', to: to?.name ?? '' }

      if (!from) return { sentence: t('audit.events.memberRoleAssigned', values) }

      if (!to) return { sentence: t('audit.events.memberRoleRemoved', values) }

      return { sentence: t('audit.events.memberRoleChanged', values) }
    },
  },
  'member.permissions_changed': {
    label: t('audit.types.memberPermissionsChanged'),
    describe: ({ data: { member, from, to } }) => ({
      sentence: t('audit.events.memberPermissionsChanged', { member: displayName(member) }),
      permissions: permissionChanges(from, to),
    }),
  },
  'invitation.sent': {
    label: t('audit.types.invitationSent'),
    describe: ({ data: { email, role } }) => ({
      sentence: role
        ? t('audit.events.invitationSentAs', { email, role: role.name })
        : t('audit.events.invitationSent', { email }),
    }),
  },
  'invitation.revoked': {
    label: t('audit.types.invitationRevoked'),
    describe: ({ data }) => ({
      sentence: t('audit.events.invitationRevoked', { email: data.email }),
    }),
  },
  'invitation.accepted': {
    label: t('audit.types.invitationAccepted'),
    describe: ({ data }) => ({
      sentence: t('audit.events.invitationAccepted', { email: data.email }),
    }),
  },
}

// SAFETY: the keys of EVENTS are exactly AuditEventType, which the mapped type above enforces.
export const AUDIT_EVENT_TYPES = Object.keys(EVENTS) as AuditEventType[]

export const AUDIT_AREAS = [...new Set(AUDIT_EVENT_TYPES.map(areaOf))]

export function areaOf(type: AuditEventType) {
  // SAFETY: every event type is `<area>.<action>`, which AuditArea is derived from.
  return type.slice(0, type.indexOf('.')) as AuditArea
}

const AREA_LABELS: Record<AuditArea, string> = {
  tenant: t('audit.areas.tenant'),
  role: t('audit.areas.role'),
  member: t('audit.areas.member'),
  invitation: t('audit.areas.invitation'),
}

export const areaLabel = (area: AuditArea) => AREA_LABELS[area]

export const eventTypeLabel = (type: AuditEventType) => EVENTS[type].label

function isKnown(type: string): type is AuditEventType {
  return Object.hasOwn(EVENTS, type)
}

function describeKnown<T extends AuditEventType>(type: T, event: EventMap[T]) {
  return EVENTS[type].describe(event)
}

/**
 * A row's text. Events of a type this build doesn't know (recorded by a newer backend, or by one
 * that has since dropped the type) still read, by their raw type.
 */
export function describeEvent(event: AuditEvent): EventDescription {
  if (!isKnown(event.type)) return { sentence: t('audit.events.unknown', { type: event.type }) }

  return describeKnown(event.type, event)
}
