import type { TransactionClientContract } from '@adonisjs/lucid/types/database';

import PlatformAdmin from '#access/models/platform_admin';

/** Idempotent: true when the user just became a platform admin, false when they already were. */
export async function grantPlatformAdmin(
  userId: string,
  trx: TransactionClientContract
) {
  const row = await PlatformAdmin.firstOrCreate(
    { userId },
    {},
    { client: trx }
  );

  return row.$isLocal;
}
