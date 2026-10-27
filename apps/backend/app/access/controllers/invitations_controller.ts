import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import Invitation from '#access/models/invitation'
import InviteMember from '#access/actions/invite_member'
import RevokeInvitation from '#access/actions/revoke_invitation'
import InvitationTransformer from '#access/transformers/invitation_transformer'
import { inviteMemberValidator, invitationParamsValidator } from '#access/validators/invitation'

/**
 * @tags Invitations
 */
export default class InvitationsController {
  /**
   * List invitations
   *
   * Requires `members.manage`. Returns the invitations not yet accepted or revoked, newest
   * first. Expired ones are included: compare `expiresAt` with the current time.
   *
   * @throws {403} Lacks `members.manage`
   */
  async index({ bouncer, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage)

    const invitations = await Invitation.query().orderBy('createdAt', 'desc')

    return serialize(InvitationTransformer.transform(invitations))
  }

  /**
   * Invite a member
   *
   * Requires `members.manage`. Emails the invitation link, valid for 7 days. Inviting an
   * email that already has a pending invitation replaces it: the old link stops working
   * and the role and expiry are reset.
   *
   * @throws {403} Lacks `members.manage`
   * @throws {import('#access/exceptions/already_member_exception').default} The email already belongs to a member of the tenant
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async store({ bouncer, request, auth, tenant, i18n, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage)
    const { email, roleId } = await request.validateUsing(inviteMemberValidator)

    const invitation = await new InviteMember().handle({
      tenantId: tenant.id,
      email,
      roleId,
      invitedById: auth.getUserOrFail().id,
      locale: i18n.locale,
    })

    return serialize(InvitationTransformer.transform(invitation))
  }

  /**
   * Revoke an invitation
   *
   * Requires `members.manage`. The invitation link stops working.
   *
   * @throws {403} Lacks `members.manage`
   * @throws {404} Invitation not found
   */
  async destroy({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage)
    const { params } = await request.validateUsing(invitationParamsValidator)

    await new RevokeInvitation().handle({ tenantId: tenant.id, id: params.id })

    return serialize({ id: params.id })
  }
}
