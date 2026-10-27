import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import AssignRole from '#access/actions/assign_role'
import { assignRoleValidator } from '#access/validators/member'

/**
 * @tags Members
 */
export default class MemberRolesController {
  /**
   * Assign a member's role
   *
   * Requires `members.manage`. Replaces the member's role; a null `roleId` leaves them
   * without one. Their individual permissions are kept.
   *
   * @throws {403} Lacks `members.manage`
   * @throws {import('#access/exceptions/member_not_found_exception').default} The user is not a member of the tenant
   * @throws {import('#access/exceptions/last_manager_exception').default} The change would leave no one able to manage members
   */
  async update({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage)
    const { params, roleId } = await request.validateUsing(assignRoleValidator)

    await new AssignRole().handle({ tenantId: tenant.id, userId: params.userId, roleId })

    return serialize({ roleId })
  }
}
