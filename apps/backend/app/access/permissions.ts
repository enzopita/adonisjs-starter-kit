export const PERMISSIONS = {
  rolesManage: 'roles.manage',
  membersManage: 'members.manage',
  auditView: 'audit.view',
  platformAdmin: 'platform.admin',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

/**
 * What a role or grant may hold. platform.admin passes every check in every tenant, so it
 * comes only from a `platform_admins` row, never from a tenant's roles or grants.
 */
export const ASSIGNABLE_PERMISSIONS = ALL_PERMISSIONS.filter(
  permission => permission !== PERMISSIONS.platformAdmin,
)

const ASSIGNABLE = new Set<string>(ASSIGNABLE_PERMISSIONS)

/** Stored strings outlive the catalog: a permission removed from it must stop granting. */
export function isAssignable(value: string): value is Permission {
  return ASSIGNABLE.has(value)
}

/** The part before the dot in an assignable permission (`members.manage` -> `members`). */
export type PermissionGroup =
  Exclude<Permission, typeof PERMISSIONS.platformAdmin> extends `${infer Group}.${string}`
    ? Group
    : never

// A type alias, not an interface: @tuyau/core's response-type inference only recognizes a
// plain object's implicit index signature, which an interface doesn't structurally expose.
export type PermissionGroupEntry = {
  key: PermissionGroup
  permissions: Permission[]
}

/**
 * Assignable permissions grouped by that prefix, in catalog order, for the frontend to
 * render organized. platform.admin never appears: it comes from ASSIGNABLE_PERMISSIONS only.
 */
export const PERMISSION_GROUPS: PermissionGroupEntry[] = (() => {
  const byGroup = new Map<PermissionGroup, Permission[]>()

  for (const permission of ASSIGNABLE_PERMISSIONS) {
    // SAFETY: every assignable permission is "<group>.<action>", checked by the Permission union.
    const key = permission.split('.')[0] as PermissionGroup
    const group = byGroup.get(key)

    if (group) group.push(permission)
    else byGroup.set(key, [permission])
  }

  return [...byGroup].map(([key, permissions]) => ({ key, permissions }))
})()
