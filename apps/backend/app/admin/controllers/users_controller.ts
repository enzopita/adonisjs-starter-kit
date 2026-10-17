import { can } from '#access/abilities'
import ListUsers from '#admin/queries/list_users'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import { listUsersValidator } from '#admin/validators/user'
import AdminUserTransformer from '#admin/transformers/admin_user_transformer'

export default class UsersController {
  async index({ bouncer, request, serialize }: HttpContext) {
    await bouncer.authorize(can, PERMISSIONS.platformAdmin)
    const { search, page, perPage } = await request.validateUsing(listUsersValidator)

    const { rows, meta } = await new ListUsers().handle({
      search,
      page: page ?? 1,
      perPage: perPage ?? 20,
    })

    return serialize(AdminUserTransformer.paginate(rows, meta))
  }
}
