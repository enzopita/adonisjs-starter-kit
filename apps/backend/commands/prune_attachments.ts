import { BaseCommand } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

import PruneAttachments from '#attachments/actions/prune_attachments';

export default class PruneAttachmentsCommand extends BaseCommand {
  static override commandName = 'attachments:prune';
  static override description =
    'Delete attachments no record references, with their files';

  static override options: CommandOptions = { startApp: true };

  override async run() {
    const deleted = await new PruneAttachments().handle();

    this.logger.info(`Deleted ${deleted} attachments`);
  }
}
