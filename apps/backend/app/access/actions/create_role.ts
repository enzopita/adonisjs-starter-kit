import Role from '#access/models/role'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import type { Permission } from '#access/permissions'

export interface CreateRoleInput {
  tenantId: string
  name: string
  permissions: Permission[]
}

export default class CreateRole {
  async handle({ tenantId, name, permissions }: CreateRoleInput) {
    return db.transaction(async trx => {
      const role = await Role.create({ name, permissions }, { client: trx })

      await audit.record(trx, 'role.created', {
        tenantId,
        subject: { type: 'role', id: role.id },
        data: { name, permissions },
      })

      return role
    })
  }
}
