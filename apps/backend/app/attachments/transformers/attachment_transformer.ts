import { BaseTransformer } from '@adonisjs/core/transformers';
import drive from '@adonisjs/drive/services/main';

import type Attachment from '#attachments/models/attachment';

export default class AttachmentTransformer extends BaseTransformer<Attachment> {
  /**
   * Whoever serializes an attachment has already authorized the record that
   * embeds it, so the URL is signed here without a policy check.
   */
  async toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'extname',
        'mimeType',
        'size',
        'createdAt',
      ]),
      url: await drive.use().getSignedUrl(this.resource.key, {
        expiresIn: '1h',
        contentType: this.resource.mimeType,
        contentDisposition: `inline; filename*=UTF-8''${encodeRfc5987(this.resource.name)}`,
      }),
    };
  }
}

/** encodeURIComponent leaves ' ( ) * ! unescaped, which RFC 5987 forbids in a filename*. */
function encodeRfc5987(value: string) {
  return encodeURIComponent(value).replace(
    /['()*!]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}
