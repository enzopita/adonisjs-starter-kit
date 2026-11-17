import type { HttpContext } from '@adonisjs/core/http';

import AcceptInvitation from '#access/actions/accept_invitation';
import { acceptInvitationValidator } from '#access/validators/invitation';
import Tenant from '#tenancy/models/tenant';
import TenantTransformer from '#tenancy/transformers/tenant_transformer';

/**
 * @tags Invitations
 */
export default class InvitationAcceptController {
  /**
   * Accept an invitation
   *
   * Joins the tenant named by the invitation with its role, and marks the user's email as
   * verified. The invitation must have been sent to the signed-in user's email. Accepting
   * an invitation to a tenant the user already belongs to only uses it up. Returns the
   * tenant; send its id in the X-Tenant-Id header of later requests.
   *
   * @response {429} Too many attempts; retry after the Retry-After header
   */
  async store({ request, auth, serialize }: HttpContext) {
    const { token } = await request.validateUsing(acceptInvitationValidator);
    const user = auth.getUserOrFail();

    const tenantId = await new AcceptInvitation().handle({
      token,
      userId: user.id,
      userEmail: user.email,
    });

    const tenant = await Tenant.findOrFail(tenantId);

    return serialize(TenantTransformer.transform(tenant));
  }
}
