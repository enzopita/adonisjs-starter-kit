import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import Role from '#access/models/role'
import RoleInUseException from '#access/exceptions/role_in_use_exception'

export interface DeleteRoleInput {
  tenantId: string
  id: string
}

export default class DeleteRole {
  /**
   * The assignments' foreign key refuses to delete a role someone holds. The delete runs in a
   * savepoint so that refusal leaves an enclosing transaction (the test suite's) usable.
   */
  async handle({ tenantId, id }: DeleteRoleInput) {
    const role = await Role.findOrFail(id)

    try {
      await db.transaction(async trx => {
        await role.useTransaction(trx).delete()

        await audit.record(trx, 'role.deleted', {
          tenantId,
          subject: { type: 'role', id: role.id },
          data: { name: role.name, permissions: role.permissions },
        })
      })
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503')
        throw new RoleInUseException()

      throw error
    }
  }
}
