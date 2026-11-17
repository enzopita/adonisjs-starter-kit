import type { HttpContext } from '@adonisjs/core/http';

import { can } from '#access/abilities';
import { ALL_PERMISSIONS } from '#access/permissions';

/**
 * @tags Permissions
 */
export default class MyPermissionsController {
  /**
   * List the signed-in user's permissions
   *
   * Returns the permission keys the signed-in user holds in the tenant, for the frontend to
   * show or hide its UI. The server still checks each permission on every request.
   */
  async show({ bouncer, serialize }: HttpContext) {
    const allowed = await Promise.all(
      ALL_PERMISSIONS.map((permission) => bouncer.allows(can, permission))
    );

    return await serialize({
      permissions: ALL_PERMISSIONS.filter((_, index) => allowed[index]),
    });
  }
}
