import type { TransactionClientContract } from '@adonisjs/lucid/types/database';

import InvalidAttachmentException from '#attachments/exceptions/invalid_attachment_exception';
import Attachment from '#attachments/models/attachment';
import type { AttachmentRule } from '#attachments/rules';

export interface ClaimAttachmentsInput {
  ids: readonly string[];
  uploaderId: string;
  rule: AttachmentRule;
}

export class ClaimAttachments {
  /**
   * Call it in the transaction that writes the consumer's FK to these ids,
   * passing only the ids that record is newly adding. The share lock holds
   * until that commit, so a concurrent prune cannot delete a row mid-claim.
   *
   * Returns the attachments in the order of `ids`.
   */
  async handle(
    trx: TransactionClientContract,
    { ids, uploaderId, rule }: ClaimAttachmentsInput
  ) {
    if (ids.length === 0) return [];

    const rows = await Attachment.query({ client: trx })
      .whereIn('id', [...ids])
      .forShare();

    const byId = new Map(rows.map((row) => [row.id, row]));

    return ids.map((id) => {
      const attachment = byId.get(id);

      if (
        !attachment ||
        attachment.uploaderId !== uploaderId ||
        !rule.extnames.includes(attachment.extname) ||
        attachment.size > rule.maxBytes
      ) {
        throw new InvalidAttachmentException();
      }

      return attachment;
    });
  }
}
