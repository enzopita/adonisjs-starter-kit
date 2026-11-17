import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import { compose } from '@adonisjs/core/helpers';
import hash from '@adonisjs/core/services/hash';
import { belongsTo } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

import Attachment from '#attachments/models/attachment';
import { UserSchema } from '#database/schema';
import { UuidAccessTokensProvider } from '#users/services/access_tokens_provider';
import type { UserAccessToken } from '#users/services/access_tokens_provider';

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
