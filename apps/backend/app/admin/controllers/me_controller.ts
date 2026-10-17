import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'

export default class MeController {
  /** Whether the signed-in user may open the admin area, for the frontend to show its entry. */
  async show({ bouncer, serialize }: HttpContext) {
    return serialize({ platformAdmin: await bouncer.allows(can, PERMISSIONS.platformAdmin) })
  }
}
