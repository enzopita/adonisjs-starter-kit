import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import Invitation from '#access/models/invitation'
import InviteMember from '#access/actions/invite_member'
import RevokeInvitation from '#access/actions/revoke_invitation'
import InvitationTransformer from '#access/transformers/invitation_transformer'
import { inviteMemberValidator, invitationParamsValidator } from '#access/validators/invitation'

export default class InvitationsController {
  async index({ bouncer, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage)

    const invitations = await Invitation.query().orderBy('createdAt', 'desc')

    return serialize(InvitationTransformer.transform(invitations))
  }

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

  async destroy({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.membersManage)
    const { params } = await request.validateUsing(invitationParamsValidator)

    await new RevokeInvitation().handle({ tenantId: tenant.id, id: params.id })

    return serialize({ id: params.id })
  }
}
