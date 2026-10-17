import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#attachments/types/audit'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import Attachment from '#attachments/models/attachment'
import { ATTACHMENT_MIME_TYPES, type AttachmentExtname } from '#attachments/rules'

export interface UploadAttachmentInput {
  file: MultipartFile
  uploaderId: string
}

export default class UploadAttachment {
  /**
   * The row is committed before the object is written, so every object has a
   * row. A failed put leaves an unreferenced row, which attachments:prune removes.
   */
  async handle({ file, uploaderId }: UploadAttachmentInput) {
    // SAFETY: uploadAttachmentValidator only accepts the registry's extnames.
    const extname = file.extname as AttachmentExtname
    const mimeType = ATTACHMENT_MIME_TYPES[extname]

    const attachment = await db.transaction(async trx => {
      const created = await Attachment.create(
        {
          uploaderId,
          name: displayName(file.clientName, extname),
          extname,
          mimeType,
          size: file.size,
        },
        { client: trx },
      )

      await audit.record(trx, 'attachment.uploaded', {
        tenantId: null,
        subject: { type: 'attachment', id: created.id },
        data: { name: created.name, size: created.size },
      })

      return created
    })

    await file.moveToDisk(attachment.key, { contentType: mimeType })

    return attachment
  }
}

/** Strips path segments and control characters from a client file name. */
function displayName(clientName: string, extname: AttachmentExtname) {
  // oxlint-disable-next-line no-control-regex -- stripping control characters is the point.
  const name = (clientName.split(/[/\\]/).pop() ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim()

  return Array.from(name || `file.${extname}`)
    .slice(0, 255)
    .join('')
}
