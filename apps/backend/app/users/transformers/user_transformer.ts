import { BaseTransformer } from '@adonisjs/core/transformers';

import AttachmentTransformer from '#attachments/transformers/attachment_transformer';
import type User from '#users/models/user';

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'fullName',
        'email',
        'emailVerifiedAt',
        'createdAt',
        'updatedAt',
        'initials',
        'locale',
        'timezone',
      ]),
      twoFactorEnabled: this.resource.twoFactorConfirmedAt !== null,
      avatar: AttachmentTransformer.transform(
        this.whenLoaded(this.resource.avatar)
      ),
    };
  }
}
