import logger from '@adonisjs/core/services/logger';
import { Job } from '@adonisjs/queue';
import type { JobOptions } from '@adonisjs/queue/types';

import PruneAuditEvents from '#audit/actions/prune_audit_events';
import { auditRetentionDays } from '#config/app';

export default class PruneAuditEventsJob extends Job<{}> {
  static override options: JobOptions = {
    maxRetries: 3,
  };

  async execute() {
    const deleted = await new PruneAuditEvents().handle({
      retentionDays: auditRetentionDays,
    });

    logger.info(`Deleted ${deleted} audit events`);
  }
}
