import { DateTime } from 'luxon';
import * as OTPAuth from 'otpauth';

import { newTwoFactorSecret } from '#auth/services/two_factor';
import type User from '#users/models/user';

/** The code an authenticator app shows for `secret`, `steps` periods of 30 seconds from now. */
export function totpCode(secret: string, steps = 0) {
  return new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
  }).generate({
    timestamp: Date.now() + steps * 30_000,
  });
}

/** Confirmed two-factor without going through enrollment, for tests about what it gates. */
export async function enableTwoFactor(user: User) {
  const secret = newTwoFactorSecret(user.email);

  user.merge({
    twoFactorSecret: secret.encrypted,
    twoFactorConfirmedAt: DateTime.now(),
  });
  await user.save();

  return secret.base32;
}
