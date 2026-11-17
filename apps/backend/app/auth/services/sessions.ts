import type { AccessToken } from '@adonisjs/auth/access_tokens';
import db from '@adonisjs/lucid/services/db';

import AccountDisabledException from '#auth/exceptions/account_disabled_exception';
import PasswordResetRequiredException from '#auth/exceptions/password_reset_required_exception';
import User from '#users/models/user';
import { SESSION_IDLE_TIMEOUT_DAYS } from '#users/services/access_tokens_provider';

export interface OpenSessionInput {
  user: User;
  userAgent: string | undefined;
  ipAddress: string;
}

/**
 * Issues an access token for a real sign-in, recording the device it was issued to. Refreshes
 * `user` afterwards, so the caller sees any state committed while the token was being created.
 */
export async function openSession({
  user,
  userAgent,
  ipAddress,
}: OpenSessionInput) {
  const token = await User.accessTokens.create(user, ['*'], {
    expiresIn: `${SESSION_IDLE_TIMEOUT_DAYS}d`,
  });

  // The provider's insert takes no extra columns, so the device info follows as its own write.
  await db
    .from('auth_access_tokens')
    .where('id', String(token.identifier))
    .update({
      user_agent: userAgent?.slice(0, 512) ?? null,
      ip_address: ipAddress,
    });

  // A disable or an admin two-factor reset committing since the caller's check may have deleted
  // the tokens before this one existed.
  await user.refresh();

  if (user.disabledAt || user.passwordResetRequiredAt) {
    await User.accessTokens.delete(user, token.identifier);

    throw user.disabledAt
      ? new AccountDisabledException()
      : new PasswordResetRequiredException();
  }

  return token;
}

/** The secret to hand the client; only a token created in this request still carries it. */
export function releaseToken(token: AccessToken): string {
  if (token.value === undefined) {
    throw new Error('Only a newly created access token carries its secret');
  }

  return token.value.release();
}
