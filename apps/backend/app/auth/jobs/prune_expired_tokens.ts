import logger from '@adonisjs/core/services/logger';
import { Job } from '@adonisjs/queue';
import type { JobOptions } from '@adonisjs/queue/types';

import PruneExpiredTokens from '#auth/actions/prune_expired_tokens';

export default class PruneExpiredTokensJob extends Job<{}> {
  static override options: JobOptions = {
    maxRetries: 3,
  };

  async execute() {
    const { accessTokens, userTokens } =
      await new PruneExpiredTokens().handle();

    logger.info(
      `Deleted ${accessTokens} access tokens and ${userTokens} user tokens`
    );
  }
}
