import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import GetMember from '#access/queries/get_member'
import type { Permission } from '#access/permissions'
import PermissionGrant from '#access/models/permission_grant'
import { KeepAManager } from '#access/services/keep_a_manager'
import MemberNotFoundException from '#access/exceptions/member_not_found_exception'

export interface ReplaceGrantsInput {
  tenantId: string
  userId: string
  permissions: Permission[]
}

export default class ReplaceGrants {
  /** The member's individual permissions in the tenant become exactly `permissions`. */
  async handle({ tenantId, userId, permissions }: ReplaceGrantsInput) {
    try {
      await db.transaction(trx =>
        new KeepAManager().handle(trx, tenantId, async () => {
          const member = await new GetMember().handle(trx, { tenantId, userId })
          const previous = await PermissionGrant.query({ client: trx }).where('user_id', userId)

          await PermissionGrant.query({ client: trx }).where('user_id', userId).delete()

          await PermissionGrant.createMany(
            permissions.map(permission => ({ userId, permission })),
            { client: trx },
          )

          await audit.record(trx, 'member.permissions_changed', {
            tenantId,
            subject: { type: 'member', id: userId },
            data: { member, from: previous.map(grant => grant.permission), to: permissions },
          })
        }),
      )
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503')
        throw new MemberNotFoundException()

      throw error
    }
  }
}
