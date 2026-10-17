import db from '@adonisjs/lucid/services/db'
import { audit, dirtyChanges } from '#core/audit/main'
import type {} from '#access/types/audit'
import Role from '#access/models/role'
import type { Permission } from '#access/permissions'
import { KeepAManager } from '#access/services/keep_a_manager'

export interface UpdateRoleInput {
  tenantId: string
  id: string
  name: string
  permissions: Permission[]
}

export default class UpdateRole {
  async handle({ tenantId, id, name, permissions }: UpdateRoleInput) {
    return db.transaction(trx =>
      new KeepAManager().handle(trx, tenantId, async () => {
        const role = await Role.query({ client: trx }).where('id', id).firstOrFail()

        role.merge({ name, permissions })
        const changes = dirtyChanges(role, ['name', 'permissions'])
        await role.save()

        await audit.record(trx, 'role.updated', {
          tenantId,
          subject: { type: 'role', id: role.id },
          data: { name: role.name, changes },
        })

        return role
      }),
    )
  }
}
