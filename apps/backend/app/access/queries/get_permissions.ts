import type User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import PlatformAdmin from '#access/models/platform_admin'
import { ALL_PERMISSIONS, isAssignable, type Permission } from '#access/permissions'

export interface GetPermissionsInput {
  user: User
  tenantId: string | null
}

/**
 * Every permission for a platform admin with two-factor confirmed. Otherwise, a platform admin
 * included, the permissions of the user's role in the tenant plus their grants there, and none
 * outside a tenant.
 */
export default class GetPermissions {
  async handle({ user, tenantId }: GetPermissionsInput): Promise<Set<Permission>> {
    if (user.twoFactorConfirmedAt && (await PlatformAdmin.findBy('userId', user.id))) {
      return new Set(ALL_PERMISSIONS)
    }

    if (!tenantId) return new Set()

    const fromRole = db
      .query<{ permission: string }>()
      .from('role_assignments')
      .join('roles', 'roles.id', 'role_assignments.role_id')
      .where('role_assignments.tenant_id', tenantId)
      .where('role_assignments.user_id', user.id)
      .select(db.raw('unnest(roles.permissions) as permission'))

    const granted = db
      .from('permission_grants')
      .where('tenant_id', tenantId)
      .where('user_id', user.id)
      .select('permission')

    const rows = await fromRole.unionAll(granted)

    return new Set(rows.flatMap(({ permission }) => (isAssignable(permission) ? [permission] : [])))
  }
}
