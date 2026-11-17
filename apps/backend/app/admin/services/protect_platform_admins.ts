import type { QueryClientContract } from '@adonisjs/lucid/types/database';

import PlatformAdmin from '#access/models/platform_admin';
import PlatformAdminProtectedException from '#admin/exceptions/platform_admin_protected_exception';

/**
 * Throws for a platform admin, the caller included: an admin is never disabled, impersonated or has
 * their two-factor reset through the API. Revoke their platform admin first.
 */
export async function ensureNotPlatformAdmin(
  userId: string,
  client?: QueryClientContract
) {
  if (await PlatformAdmin.findBy('userId', userId, { client })) {
    throw new PlatformAdminProtectedException();
  }
}
