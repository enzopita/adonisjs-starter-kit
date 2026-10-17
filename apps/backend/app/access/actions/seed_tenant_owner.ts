import db from '@adonisjs/lucid/services/db'
import Role from '#access/models/role'
import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import i18nManager from '@adonisjs/i18n/services/main'
import GetMember from '#access/queries/get_member'
import RoleAssignment from '#access/models/role_assignment'
import { runInTenant } from '#tenancy/tenant_context'
import { ASSIGNABLE_PERMISSIONS } from '#access/permissions'

export interface SeedTenantOwnerInput {
  tenantId: string
  creatorId: string
  locale: string
}

/**
 * Gives a new tenant an Owner role, named in the creator's locale, with every assignable
 * permission, held by its creator. Safe to run again with the same locale: an existing Owner
 * role, or a role the creator already holds, is kept, and only what it creates is audited.
 */
export default class SeedTenantOwner {
  async handle({ tenantId, creatorId, locale }: SeedTenantOwnerInput) {
    await runInTenant(tenantId, () =>
      db.transaction(async trx => {
        const owner = await Role.firstOrCreate(
          { name: i18nManager.locale(locale).t('access.owner_role') },
          { permissions: ASSIGNABLE_PERMISSIONS },
          { client: trx },
        )

        if (owner.$isLocal) {
          await audit.record(trx, 'role.created', {
            tenantId,
            subject: { type: 'role', id: owner.id },
            data: { name: owner.name, permissions: owner.permissions },
          })
        }

        const assignment = await RoleAssignment.firstOrCreate(
          { userId: creatorId },
          { roleId: owner.id },
          { client: trx },
        )

        if (assignment.$isLocal) {
          await audit.record(trx, 'member.role_changed', {
            tenantId,
            subject: { type: 'member', id: creatorId },
            data: {
              member: await new GetMember().handle(trx, { tenantId, userId: creatorId }),
              from: null,
              to: { id: owner.id, name: owner.name },
            },
          })
        }
      }),
    )
  }
}
