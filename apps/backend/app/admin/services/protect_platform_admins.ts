import PlatformAdmin from '#access/models/platform_admin'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'
import PlatformAdminProtectedException from '#admin/exceptions/platform_admin_protected_exception'

/**
 * Throws for a platform admin, the caller included: admins are managed from `node ace admin:grant`
 * and the repl, never disabled or impersonated through the API.
 */
export async function ensureNotPlatformAdmin(userId: string, client?: QueryClientContract) {
  if (await PlatformAdmin.findBy('userId', userId, { client })) {
    throw new PlatformAdminProtectedException()
  }
}
