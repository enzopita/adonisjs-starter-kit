import type { api } from '@/features/core/api'
import { t } from '@/features/core/i18n'

type TenantEventRow = Awaited<ReturnType<typeof api.audit.auditEvents.index>>['data'][number]

type AccountEventRow = Awaited<ReturnType<typeof api.audit.accountActivity.index>>['data'][number]

export type AuditEventRow = TenantEventRow | AccountEventRow

export type AuditEvent = AuditEventRow['event']

export type AuditEventType = AuditEvent['type']

export type TenantEventType = TenantEventRow['event']['type']

/** The part of an event type before its dot (`role` for `role.updated`), one filter group each. */
export type AuditArea = TenantEventType extends `${infer Area}.${string}` ? Area : never

export type AuditSubject = NonNullable<TenantEventRow['event']['subject']>

type EventMap = { [E in AuditEvent as E['type']]: E }

/**
 * What a timeline row says after the actor's name, and the permissions the event added or
 * removed. A `standalone` sentence reads without an actor: nobody signed in did it.
 */
export type EventDescription = {
  sentence: string
  standalone?: boolean
  permissions?: { added: string[]; removed: string[] }
}

/** Permission names belong to the access feature, which depends on this one: callers pass them in. */
export type PermissionLabel = (permission: string) => string

/** What a description may read besides its event: who did it, and how to name a permission. */
type DescribeContext = { actorId: string | null; permissionLabel: PermissionLabel }

type EventText<T extends AuditEventType> = {
  describe: (event: EventMap[T], context: DescribeContext) => EventDescription
}

/** A workspace event also names its type in the trail's filter. */
type LabeledEventText<T extends AuditEventType> = EventText<T> & { label: string }

type Snapshot = { email: string; fullName: string | null }

const displayName = (member: Snapshot) => member.fullName ?? member.email

function permissionChanges(from: readonly string[], to: readonly string[]) {
  return {
    added: to.filter(permission => !from.includes(permission)),
    removed: from.filter(permission => !to.includes(permission)),
  }
}

/** One entry per event type the API returns: a new backend type without one fails the typecheck. */
type EventTexts<Types extends AuditEventType> = { [T in Types]: EventText<T> }

type TenantEventTexts = { [T in TenantEventType]: LabeledEventText<T> }

const TENANT_EVENTS: TenantEventTexts = {
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
    describe: ({ subject, data: { member, from, to } }, { actorId }) => {
      const values = { member: displayName(member), from: from?.name ?? '', to: to?.name ?? '' }

      if (to && subject.id === actorId)
        return { sentence: t('audit.events.memberRoleTaken', values) }

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
  'access.denied': {
    label: t('audit.types.accessDenied'),
    describe: ({ data }, { permissionLabel }) => ({
      sentence: t('audit.events.accessDenied', {
        permission: permissionLabel(data.permission),
        method: data.method,
        route: data.route ?? '',
      }),
    }),
  },
  'access.tenant_denied': {
    label: t('audit.types.tenantAccessDenied'),
    describe: () => ({ sentence: t('audit.events.tenantAccessDenied') }),
  },
  'admin.tenant_renamed': {
    label: t('audit.types.tenantRenamed'),
    describe: ({ data }) => ({
      sentence: t('audit.events.tenantRenamed', { from: data.from, to: data.to }),
    }),
  },
  'admin.tenant_suspended': {
    label: t('audit.types.tenantSuspended'),
    describe: ({ data }) => ({ sentence: t('audit.events.tenantSuspended', { name: data.name }) }),
  },
  'admin.tenant_reactivated': {
    label: t('audit.types.tenantReactivated'),
    describe: ({ data }) => ({
      sentence: t('audit.events.tenantReactivated', { name: data.name }),
    }),
  },
}

const ACCOUNT_EVENTS: EventTexts<Exclude<AuditEventType, TenantEventType>> = {
  'auth.signed_up': {
    describe: () => ({ sentence: t('audit.events.signedUp') }),
  },
  'auth.logged_in': {
    describe: () => ({ sentence: t('audit.events.loggedIn') }),
  },
  'auth.login_failed': {
    describe: ({ data }) => ({
      sentence: t('audit.events.loginFailed', { email: data.email }),
      standalone: true,
    }),
  },
  'auth.logged_out': {
    describe: () => ({ sentence: t('audit.events.loggedOut') }),
  },
  'user.avatar_changed': {
    describe: ({ data: { changes } }) => {
      if (!changes.avatarAttachmentId?.to) return { sentence: t('audit.events.avatarRemoved') }

      if (!changes.avatarAttachmentId.from) return { sentence: t('audit.events.avatarAdded') }

      return { sentence: t('audit.events.avatarChanged') }
    },
  },
  'attachment.uploaded': {
    describe: ({ data }) => ({ sentence: t('audit.events.fileUploaded', { name: data.name }) }),
  },
  'admin.user_disabled': {
    describe: ({ data }) => ({ sentence: t('audit.events.userDisabled', { email: data.email }) }),
  },
  'admin.user_enabled': {
    describe: ({ data }) => ({ sentence: t('audit.events.userEnabled', { email: data.email }) }),
  },
}

const EVENTS: EventTexts<AuditEventType> = { ...TENANT_EVENTS, ...ACCOUNT_EVENTS }

// SAFETY: the keys of TENANT_EVENTS are exactly TenantEventType, which its mapped type enforces.
export const AUDIT_EVENT_TYPES = Object.keys(TENANT_EVENTS) as TenantEventType[]

export const AUDIT_AREAS = [...new Set(AUDIT_EVENT_TYPES.map(areaOf))]

export function areaOf(type: TenantEventType) {
  // SAFETY: every event type is `<area>.<action>`, which AuditArea is derived from.
  return type.slice(0, type.indexOf('.')) as AuditArea
}

const AREA_LABELS: Record<AuditArea, string> = {
  tenant: t('audit.areas.tenant'),
  role: t('audit.areas.role'),
  member: t('audit.areas.member'),
  invitation: t('audit.areas.invitation'),
  access: t('audit.areas.access'),
  admin: t('audit.areas.admin'),
}

export const areaLabel = (area: AuditArea) => AREA_LABELS[area]

export const eventTypeLabel = (type: TenantEventType) => TENANT_EVENTS[type].label

function isKnown(type: string): type is AuditEventType {
  return Object.hasOwn(EVENTS, type)
}

function describeKnown<T extends AuditEventType>(
  type: T,
  event: EventMap[T],
  context: DescribeContext,
) {
  return EVENTS[type].describe(event, context)
}

/**
 * A row's text. Events of a type this build doesn't know (recorded by a newer backend, or by one
 * that has since dropped the type) still read, by their raw type.
 */
export function describeEvent(
  { event, actor }: AuditEventRow,
  permissionLabel: PermissionLabel,
): EventDescription {
  if (!isKnown(event.type)) return { sentence: t('audit.events.unknown', { type: event.type }) }

  return describeKnown(event.type, event, { actorId: actor?.id ?? null, permissionLabel })
}
