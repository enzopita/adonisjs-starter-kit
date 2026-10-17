import { useSuspenseQuery } from '@tanstack/react-query'
import type { api } from '@/features/core/api'
import { myPermissionsQuery } from '@/features/access/queries'
import { t } from '@/features/core/i18n'
import { useActiveTenant } from '@/features/tenancy/workspace'

type MyPermissions = Awaited<ReturnType<typeof api.access.myPermissions.show>>['data']

export type Permission = MyPermissions['permissions'][number]

type CatalogGroup = Awaited<
  ReturnType<typeof api.access.permissionCatalog.show>
>['data']['groups'][number]

export type PermissionGroupKey = CatalogGroup['key']

/** One catalog group: its key and the assignable permissions under it, in catalog order. */
export type PermissionGroup = CatalogGroup

/**
 * What a role or grant may hold, matching the request body a role or grant endpoint accepts.
 * Narrower than `Permission`: a response's `permissions` field types as the full union, but
 * only platform-admin status ever produces `platform.admin`, never a role or a direct grant.
 */
export type AssignablePermission = Exclude<Permission, 'platform.admin'>

export function usePermissions(): readonly Permission[] {
  const tenant = useActiveTenant()

  return useSuspenseQuery(myPermissionsQuery(tenant.id)).data.data.permissions
}

export function can(permissions: readonly Permission[], permission: Permission) {
  return permissions.includes(permission)
}

type Label = { label: string; description?: string }

const LABELS: Record<Permission | PermissionGroupKey, Label> = {
  'roles': { label: t('access.permissions.roles') },
  'members': { label: t('access.permissions.members') },
  'audit': { label: t('access.permissions.audit') },
  'roles.manage': {
    label: t('access.permissions.manageRoles'),
    description: t('access.permissions.manageRolesDescription'),
  },
  'members.manage': {
    label: t('access.permissions.manageMembers'),
    description: t('access.permissions.manageMembersDescription'),
  },
  'audit.view': {
    label: t('access.permissions.viewAudit'),
    description: t('access.permissions.viewAuditDescription'),
  },
  'platform.admin': {
    label: t('access.permissions.platformAdmin'),
    description: t('access.permissions.platformAdminDescription'),
  },
}

function isLabelled(key: string): key is keyof typeof LABELS {
  return key in LABELS
}

export function permissionLabel(key: string): Label {
  return isLabelled(key) ? LABELS[key] : { label: key }
}
