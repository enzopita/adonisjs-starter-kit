import type { TransactionClientContract } from '@adonisjs/lucid/types/database';
import { DateTime } from 'luxon';
import type { DurationLikeObject } from 'luxon';

import UserToken from '#auth/models/user_token';
import type { UserTokenPurpose } from '#auth/models/user_token';
import { hashToken, newToken } from '#core/tokens';
import User from '#users/models/user';

export const USER_TOKEN_EXPIRY = {
  password_reset: { minutes: 60 },
  email_verification: { hours: 24 },
} satisfies Record<UserTokenPurpose, DurationLikeObject>;

/** Replaces the user's token of this purpose and returns the raw one, for the mailed link only. */
export async function issueUserToken(
  trx: TransactionClientContract,
  userId: string,
  purpose: UserTokenPurpose
) {
  // Two concurrent issues would both delete nothing, then collide on unique (user_id, purpose).
  await User.query({ client: trx })
    .where('id', userId)
    .forUpdate()
    .firstOrFail();

  await UserToken.query({ client: trx })
    .where('user_id', userId)
    .where('purpose', purpose)
    .delete();

  const { raw: token, hash: tokenHash } = newToken();

  await UserToken.create(
    {
      userId,
      purpose,
      tokenHash,
      expiresAt: DateTime.now().plus(USER_TOKEN_EXPIRY[purpose]),
    },
    { client: trx }
  );

  return token;
}

/**
 * Deletes the token and returns its user, or null when it is unknown, expired or of another
 * purpose. The row lock makes a concurrent use of the same token wait, then find nothing.
 */
export async function consumeUserToken(
  trx: TransactionClientContract,
  purpose: UserTokenPurpose,
  token: string
) {
  const row = await UserToken.query({ client: trx })
    .where('token_hash', hashToken(token))
    .where('purpose', purpose)
    .forUpdate()
    .first();

  if (!row || row.expiresAt < DateTime.now()) {
    return null;
  }

  await row.delete();

  return await User.findOrFail(row.userId, { client: trx });
}
