import type { HttpContext } from '@adonisjs/core/http';

import { PERMISSION_GROUPS } from '#access/permissions';

/**
 * @tags Permissions
 */
export default class PermissionCatalogController {
  /**
   * List the permission catalog
   *
   * Any member of the tenant may call it. Returns every permission a role or a member can
   * hold, grouped by area, for rendering role and permission editors.
   */
  async show({ serialize }: HttpContext) {
    return await serialize({ groups: PERMISSION_GROUPS });
  }
}
