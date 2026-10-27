import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import ReplaceGrants from '#access/actions/replace_grants'
import { replaceGrantsValidator } from '#access/validators/member'

/**
 * @tags Members
 */
export default class MemberPermissionsController {
  /**
   * Replace a member's individual permissions
   *
   * Requires `members.manage`. The member's individual permissions become exactly the given
   * list; an empty list removes them all. Permissions from their role are not affected.
   *
   * @throws {403} Lacks `members.manage`
   * @throws {import('#access/exceptions/member_not_found_exception').default} The user is not a member of the tenant
   * @throws {import('#access/exceptions/last_manager_exception').default} The change would leave no one able to manage members
   */
  async update({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage)
    const { params, permissions } = await request.validateUsing(replaceGrantsValidator)

    await new ReplaceGrants().handle({ tenantId: tenant.id, userId: params.userId, permissions })

    return serialize({ permissions })
  }
}
