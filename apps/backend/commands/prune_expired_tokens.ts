import { BaseCommand } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

import PruneExpiredTokens from '#auth/actions/prune_expired_tokens';

export default class PruneExpiredTokensCommand extends BaseCommand {
  static override commandName = 'auth:prune-tokens';
  static override description =
    'Delete expired access tokens and single-use emailed tokens';

  static override options: CommandOptions = { startApp: true };

  override async run() {
    const { accessTokens, userTokens } =
      await new PruneExpiredTokens().handle();

    this.logger.info(
      `Deleted ${accessTokens} access tokens and ${userTokens} user tokens`
    );
  }
}
