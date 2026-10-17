import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import PlatformAdmin from '#access/models/platform_admin'

export interface ListUsersInput {
  search?: string
  page: number
  perPage: number
}

export interface UserRow {
  user: User
  platformAdmin: boolean
  tenantCount: number
}

export default class ListUsers {
  async handle({ search, page, perPage }: ListUsersInput) {
    const users = await User.query()
      .if(search, query =>
        query.where(matches =>
          matches.whereILike('email', `%${search}%`).orWhereILike('full_name', `%${search}%`),
        ),
      )
      .preload('avatar')
      .orderBy('email')
      .paginate(page, perPage)

    const userIds = users.all().map(user => user.id)

    const memberships: { userId: string; count: string }[] = await db
      .from('tenant_memberships')
      .whereIn('user_id', userIds)
      .groupBy('user_id')
      .select('user_id as userId')
      .count('* as count')

    const tenantCountByUser = new Map(memberships.map(row => [row.userId, Number(row.count)]))

    const admins = await PlatformAdmin.query().whereIn('userId', userIds)
    const adminIds = new Set(admins.map(admin => admin.userId))

    const rows: UserRow[] = users.all().map(user => ({
      user,
      platformAdmin: adminIds.has(user.id),
      tenantCount: tenantCountByUser.get(user.id) ?? 0,
    }))

    return { rows, meta: users.getMeta() }
  }
}
