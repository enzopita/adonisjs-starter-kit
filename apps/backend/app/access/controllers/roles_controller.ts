import Role from '#access/models/role'
import { can } from '#access/abilities'
import type { HttpContext } from '@adonisjs/core/http'
import CreateRole from '#access/actions/create_role'
import DeleteRole from '#access/actions/delete_role'
import UpdateRole from '#access/actions/update_role'
import { PERMISSIONS } from '#access/permissions'
import RoleTransformer from '#access/transformers/role_transformer'
import {
  createRoleValidator,
  roleParamsValidator,
  updateRoleValidator,
} from '#access/validators/role'

export default class RolesController {
  /** A members manager needs the role list to pick one when inviting or assigning. */
  async index({ bouncer, serialize }: HttpContext) {
    const allowed =
      (await bouncer.allows(can, PERMISSIONS.rolesManage)) ||
      (await bouncer.allows(can, PERMISSIONS.membersManage))

    if (!allowed) await bouncer.authorize(can, PERMISSIONS.rolesManage)

    const roles = await Role.query().orderBy('name')

    return serialize(RoleTransformer.transform(roles))
  }

  async store({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.rolesManage)
    const { name, permissions } = await request.validateUsing(createRoleValidator)

    const role = await new CreateRole().handle({ tenantId: tenant.id, name, permissions })

    return serialize(RoleTransformer.transform(role))
  }

  async update({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.rolesManage)
    const { params, name, permissions } = await request.validateUsing(updateRoleValidator)

    const role = await new UpdateRole().handle({
      tenantId: tenant.id,
      id: params.id,
      name,
      permissions,
    })

    return serialize(RoleTransformer.transform(role))
  }

  async destroy({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.rolesManage)
    const { params } = await request.validateUsing(roleParamsValidator)

    await new DeleteRole().handle({ tenantId: tenant.id, id: params.id })

    return serialize({ id: params.id })
  }
}
