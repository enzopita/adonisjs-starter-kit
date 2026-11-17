import type { MultipartFile } from '@adonisjs/core/bodyparser';
import db from '@adonisjs/lucid/services/db';

import Attachment from '#attachments/models/attachment';
import { ATTACHMENT_MIME_TYPES, isAttachmentExtname } from '#attachments/rules';
import type { AttachmentExtname } from '#attachments/rules';
import type {} from '#attachments/types/audit';
import { audit } from '#core/audit/main';

export interface UploadAttachmentInput {
  file: MultipartFile;
  uploaderId: string;
}

export default class UploadAttachment {
  /**
   * The row is committed before the object is written, so every object has a
   * row. A failed put leaves an unreferenced row, which attachments:prune removes.
   */
  async handle({ file, uploaderId }: UploadAttachmentInput) {
    const { extname } = file;

    // uploadAttachmentValidator only accepts the registry's extnames.
    if (extname === undefined || !isAttachmentExtname(extname)) {
      throw new Error('Unvalidated attachment extname');
    }

    const mimeType = ATTACHMENT_MIME_TYPES[extname];

    const attachment = await db.transaction(async (trx) => {
      const created = await Attachment.create(
        {
          uploaderId,
          name: displayName(file.clientName, extname),
          extname,
          mimeType,
          size: file.size,
        },
        { client: trx }
      );

      await audit.record(trx, 'attachment.uploaded', {
        tenantId: null,
        subject: { type: 'attachment', id: created.id },
        data: { name: created.name, size: created.size },
      });

      return created;
    });

    await file.moveToDisk(attachment.key, { contentType: mimeType });

    return attachment;
  }
}

/** Strips path segments and control characters from a client file name. */
function displayName(clientName: string, extname: AttachmentExtname) {
  const name = (clientName.split(/[/\\]/u).pop() ?? '')
    // oxlint-disable-next-line no-control-regex -- stripping control characters is the point.
    .replaceAll(/[\u0000-\u001F\u007F]/gu, '')
    .trim();

  // oxlint-disable-next-line typescript/no-misused-spread -- splits by code point on purpose, so the cut never halves a surrogate pair.
  return [...(name || `file.${extname}`)].slice(0, 255).join('');
}
