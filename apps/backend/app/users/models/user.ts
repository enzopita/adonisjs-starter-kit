import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import vine from '@vinejs/vine'
import { belongsTo } from '@adonisjs/lucid/orm'
import Attachment from '#attachments/models/attachment'
import type { Secret } from '@adonisjs/core/helpers'
import type { LucidModel } from '@adonisjs/lucid/types/model'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { AccessTokenDbColumns } from '@adonisjs/auth/types/access_tokens'
import { AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

/** `impersonatorId` is the platform admin acting as the token's user, null for their own sign-in. */
export type UserAccessToken = AccessToken & { impersonatorId: string | null }

/** Postgres rejects a non-uuid id with an error, which would turn a forged token into a 500. */
class UuidAccessTokensProvider<Model extends LucidModel> extends DbAccessTokensProvider<Model> {
  override async verify(tokenValue: Secret<string>) {
    const decoded = AccessToken.decode(this.prefix, tokenValue.release())

    if (!decoded || !vine.helpers.isUUID(decoded.identifier)) return null

    return super.verify(tokenValue)
  }

  protected override dbRowToAccessToken(
    dbRow: AccessTokenDbColumns & { impersonator_id: string | null },
  ): UserAccessToken {
    return Object.assign(super.dbRowToAccessToken(dbRow), {
      impersonatorId: dbRow.impersonator_id,
    })
  }
}

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = new UuidAccessTokensProvider({ tokenableModel: User })
  declare currentAccessToken?: UserAccessToken

  @belongsTo(() => Attachment, { foreignKey: 'avatarAttachmentId' })
  declare avatar: BelongsTo<typeof Attachment> | null

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')

    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    return (first ?? '').slice(0, 2).toUpperCase()
  }
}
