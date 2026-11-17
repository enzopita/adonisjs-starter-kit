import type { AttachmentExtname } from '#attachments/rules';
import { AttachmentSchema } from '#database/schema';

export default class Attachment extends AttachmentSchema {
  declare extname: AttachmentExtname;

  get key() {
    return `attachments/${this.id}`;
  }
}
