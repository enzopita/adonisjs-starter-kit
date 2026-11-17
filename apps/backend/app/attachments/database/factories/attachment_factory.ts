import { randomUUID } from 'node:crypto';

import factory from '@adonisjs/lucid/factories';

import Attachment from '#attachments/models/attachment';

export const AttachmentFactory = factory
  .define(Attachment, async () => {
    return {
      uploaderId: randomUUID(),
      name: 'image.png',
      extname: 'png' as const,
      mimeType: 'image/png',
      size: 68,
    };
  })
  .build();
