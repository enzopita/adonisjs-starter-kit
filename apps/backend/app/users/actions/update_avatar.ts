import db from '@adonisjs/lucid/services/db';

import { defineAttachmentRule } from '#attachments/rules';
import { ClaimAttachments } from '#attachments/services/claim_attachments';
import { audit, dirtyChanges } from '#core/audit/main';
import type User from '#users/models/user';
import type {} from '#users/types/audit';

const avatarRule = defineAttachmentRule({
  extnames: ['jpg', 'jpeg', 'png', 'webp'],
  maxSize: '2mb',
});

export interface UpdateAvatarInput {
  user: User;
  attachmentId: string | null;
}

export default class UpdateAvatar {
  /** The replaced avatar is left in place: attachments:prune removes it once nothing references it. */
  async handle({ user, attachmentId }: UpdateAvatarInput) {
    return await db.transaction(async (trx) => {
      user.useTransaction(trx);

      if (attachmentId !== null && attachmentId !== user.avatarAttachmentId) {
        await new ClaimAttachments().handle(trx, {
          ids: [attachmentId],
          uploaderId: user.id,
          rule: avatarRule,
        });
      }

      user.avatarAttachmentId = attachmentId;
      const changes = dirtyChanges(user, ['avatarAttachmentId']);
      await user.save();

      await audit.record(trx, 'user.avatar_changed', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        data: { changes },
      });

      await user.load('avatar');

      return user;
    });
  }
}
