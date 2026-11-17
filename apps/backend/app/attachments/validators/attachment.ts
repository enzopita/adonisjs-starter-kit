import vine from '@vinejs/vine';

import { ATTACHMENT_EXTNAMES } from '#attachments/rules';

export const uploadAttachmentValidator = vine.create({
  file: vine.file({ size: '20mb', extnames: ATTACHMENT_EXTNAMES }),
});
