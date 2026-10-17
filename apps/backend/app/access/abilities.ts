import type User from '#users/models/user'
import { Bouncer } from '@adonisjs/bouncer'
import { PermissionDenial } from '#access/permission_denial'
import { currentTenantId } from '#tenancy/tenant_context'
import GetPermissions from '#access/queries/get_permissions'
import type { Permission } from '#access/permissions'

/**
 * Keyed by the User instance auth loads for each request: a tenant resolves on its first
 * check, once per request, and a route that never checks runs no query.
 */
const resolved = new WeakMap<User, Map<string | null, Promise<Set<Permission>>>>()

function permissionsOf(user: User, tenantId: string | null) {
  let byTenant = resolved.get(user)

  if (!byTenant) {
    byTenant = new Map()
    resolved.set(user, byTenant)
  }

  let permissions = byTenant.get(tenantId)

  if (!permissions) {
    permissions = new GetPermissions().handle({ userId: user.id, tenantId })
    byTenant.set(tenantId, permissions)
  }

  return permissions
}

/** The one authorization decision: `await bouncer.authorize(can, PERMISSIONS.rolesManage)`. */
export const can = Bouncer.ability(async (user: User, permission: Permission) => {
  const tenantId = currentTenantId()

  return (
    (await permissionsOf(user, tenantId)).has(permission) ||
    new PermissionDenial(permission, tenantId)
  )
})
