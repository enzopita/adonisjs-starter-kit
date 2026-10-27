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

/**
 * @tags Roles
 */
export default class RolesController {
  /**
   * List roles
   *
   * Requires `roles.manage` or `members.manage`, so a members manager can pick a role when
   * inviting or assigning. Sorted by name.
   *
   * @throws {403} Lacks both `roles.manage` and `members.manage`
   */
  async index({ bouncer, serialize }: HttpContext) {
    const allowed =
      (await bouncer.allows(can, PERMISSIONS.rolesManage)) ||
      (await bouncer.allows(can, PERMISSIONS.membersManage))

    if (!allowed) await bouncer.authorize(can, PERMISSIONS.rolesManage)

    const roles = await Role.query().orderBy('name')

    return serialize(RoleTransformer.transform(roles))
  }

  /**
   * Create a role
   *
   * Requires `roles.manage`. Role names are unique in the tenant.
   *
   * @throws {403} Lacks `roles.manage`
   */
  async store({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.rolesManage)
    const { name, permissions } = await request.validateUsing(createRoleValidator)

    const role = await new CreateRole().handle({ tenantId: tenant.id, name, permissions })

    return serialize(RoleTransformer.transform(role))
  }

  /**
   * Update a role
   *
   * Requires `roles.manage`. Replaces the role's name and its whole permission list.
   *
   * @throws {403} Lacks `roles.manage`
   * @throws {404} Role not found
   * @throws {import('#access/exceptions/last_manager_exception').default} The change would leave no one able to manage members
   */
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

  /**
   * Delete a role
   *
   * Requires `roles.manage`. A role still assigned to a member cannot be deleted: assign
   * those members another role first.
   *
   * @throws {403} Lacks `roles.manage`
   * @throws {404} Role not found
   * @throws {import('#access/exceptions/role_in_use_exception').default} The role is still assigned to a member
   */
  async destroy({ bouncer, request, tenant, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.rolesManage)
    const { params } = await request.validateUsing(roleParamsValidator)

    await new DeleteRole().handle({ tenantId: tenant.id, id: params.id })

    return serialize({ id: params.id })
  }
}
