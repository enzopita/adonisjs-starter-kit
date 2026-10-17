import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import Tenant from '#tenancy/models/tenant'
import PlatformAdmin from '#access/models/platform_admin'

export interface GetTenantInput {
  id: string
}

export interface TenantMemberRow {
  user: User
  platformAdmin: boolean
  /** The name of the member's role in the tenant, null when they hold none. */
  role: string | null
}

/** Reads role_assignments through `db`, which the tenant scope doesn't reach, filtering tenant_id itself. */
export default class GetTenant {
  async handle({ id }: GetTenantInput) {
    const tenant = await Tenant.findOrFail(id)

    const users = await User.query()
      .whereIn('id', db.from('tenant_memberships').where('tenant_id', id).select('user_id'))
      .preload('avatar')
      .orderByRaw('coalesce(full_name, email)')

    const userIds = users.map(user => user.id)

    const roles: { userId: string; name: string }[] = await db
      .from('role_assignments')
      .join('roles', 'roles.id', 'role_assignments.role_id')
      .where('role_assignments.tenant_id', id)
      .select('role_assignments.user_id as userId', 'roles.name as name')

    const roleByUser = new Map(roles.map(row => [row.userId, row.name]))

    const admins = await PlatformAdmin.query().whereIn('userId', userIds)
    const adminIds = new Set(admins.map(admin => admin.userId))

    const members: TenantMemberRow[] = users.map(user => ({
      user,
      platformAdmin: adminIds.has(user.id),
      role: roleByUser.get(user.id) ?? null,
    }))

    return { tenant, members }
  }
}
