import { createUser, makePlatformAdmin } from '#access/tests/seed';
import { enableTwoFactor } from '#auth/tests/two_factor';

/** A platform admin who can use the admin area: two-factor is confirmed. */
export async function admin() {
  const holder = await createUser();
  await makePlatformAdmin(holder);
  await enableTwoFactor(holder);

  return holder;
}
