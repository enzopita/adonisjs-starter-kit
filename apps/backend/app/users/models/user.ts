import {
  AccessToken,
  DbAccessTokensProvider,
} from '@adonisjs/auth/access_tokens';
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import type { AccessTokenDbColumns } from '@adonisjs/auth/types/access_tokens';
import { compose } from '@adonisjs/core/helpers';
import type { Secret } from '@adonisjs/core/helpers';
import hash from '@adonisjs/core/services/hash';
import { belongsTo } from '@adonisjs/lucid/orm';
import type { LucidModel } from '@adonisjs/lucid/types/model';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import vine from '@vinejs/vine';
import { DateTime } from 'luxon';

import Attachment from '#attachments/models/attachment';
import { UserSchema } from '#database/schema';

/** `impersonatorId` is the platform admin acting as the token's user, null for their own sign-in. */
export type UserAccessToken = AccessToken & { impersonatorId: string | null };

/**
 * A session stays alive while it's used and stops working after this many days of idle time.
 * `openSession` sets it on creation; the provider's `verify()` below pushes it forward on use.
 */
export const SESSION_IDLE_TIMEOUT_DAYS = 30;

/**
 * Postgres rejects a non-uuid id with an error, which would turn a forged token into a 500.
 *
 * `verify()` is reimplemented rather than extended: the base provider's write that bumps
 * `last_used_at` is the one write every authenticated request already makes, so the sliding
 * expiry rides in the same `UPDATE` instead of a second query per request. Impersonation
 * tokens (`impersonator_id` set) are excluded, so their 1-hour cap holds.
 */
class UuidAccessTokensProvider<
  Model extends LucidModel,
> extends DbAccessTokensProvider<Model> {
  override async verify(tokenValue: Secret<string>) {
    const decoded = AccessToken.decode(this.prefix, tokenValue.release());

    if (!decoded || !vine.helpers.isUUID(decoded.identifier)) return null;

    const db = await this.getDb();

    const dbRow:
      | (AccessTokenDbColumns & { impersonator_id: string | null })
      | null = await db
      .query()
      .from(this.table)
      .where({ id: decoded.identifier, type: this.type })
      .limit(1)
      .first();

    if (!dbRow) return null;

    // Check against the row's own expiry before touching it: sliding it forward first would
    // resurrect a token that is already past its idle timeout.
    const accessToken = this.dbRowToAccessToken(dbRow);

    if (!accessToken.verify(decoded.secret) || accessToken.isExpired())
      return null;

    const now = new Date();

    const expiresAt = dbRow.impersonator_id
      ? undefined
      : DateTime.now().plus({ days: SESSION_IDLE_TIMEOUT_DAYS }).toJSDate();

    accessToken.lastUsedAt = now;

    if (expiresAt) accessToken.expiresAt = expiresAt;

    await db
      .from(this.table)
      .where({ id: dbRow.id, type: dbRow.type })
      .update({
        last_used_at: now,
        ...(expiresAt && { expires_at: expiresAt }),
      });

    return accessToken;
  }

  protected override dbRowToAccessToken(
    dbRow: AccessTokenDbColumns & { impersonator_id: string | null }
  ): UserAccessToken {
    return Object.assign(super.dbRowToAccessToken(dbRow), {
      impersonatorId: dbRow.impersonator_id,
    });
  }
}

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = new UuidAccessTokensProvider({ tokenableModel: User });
  declare currentAccessToken?: UserAccessToken;

  @belongsTo(() => Attachment, { foreignKey: 'avatarAttachmentId' })
  declare avatar: BelongsTo<typeof Attachment> | null;

  get initials() {
    const [first, last] = this.fullName
      ? this.fullName.split(' ')
      : [this.email.split('@')[0]];

    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }

    return (first ?? '').slice(0, 2).toUpperCase();
  }
}
