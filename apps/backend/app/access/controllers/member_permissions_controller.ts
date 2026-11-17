import type { HttpContext } from '@adonisjs/core/http';

import { can } from '#access/abilities';
import ReplaceGrants from '#access/actions/replace_grants';
import { PERMISSIONS } from '#access/permissions';
import { replaceGrantsValidator } from '#access/validators/member';

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
   * @response {403} Lacks `members.manage`
   */
  async update({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage);
    const { params, permissions } = await request.validateUsing(
      replaceGrantsValidator
    );

    await new ReplaceGrants().handle({
      tenantId: tenant.id,
      userId: params.userId,
      permissions,
    });

    return serialize({ permissions });
  }
}
