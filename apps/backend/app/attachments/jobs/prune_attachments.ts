import logger from '@adonisjs/core/services/logger';
import { Job } from '@adonisjs/queue';
import type { JobOptions } from '@adonisjs/queue/types';

import PruneAttachments from '#attachments/actions/prune_attachments';

export default class PruneAttachmentsJob extends Job<{}> {
  static override options: JobOptions = {
    maxRetries: 3,
  };

  async execute() {
    const deleted = await new PruneAttachments().handle();

    logger.info(`Deleted ${deleted} attachments`);
  }
}
