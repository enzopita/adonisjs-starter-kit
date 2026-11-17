import type { HttpContext } from '@adonisjs/core/http';

import { can } from '#access/abilities';
import AssignRole from '#access/actions/assign_role';
import { PERMISSIONS } from '#access/permissions';
import { assignRoleValidator } from '#access/validators/member';

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
   * @response {403} Lacks `members.manage`
   */
  async update({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage);
    const { params, roleId } = await request.validateUsing(assignRoleValidator);

    await new AssignRole().handle({
      tenantId: tenant.id,
      userId: params.userId,
      roleId,
    });

    return await serialize({ roleId });
  }
}
