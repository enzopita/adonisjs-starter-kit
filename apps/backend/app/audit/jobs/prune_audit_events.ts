import { Job } from '@adonisjs/queue'
import { auditRetentionDays } from '#config/app'
import logger from '@adonisjs/core/services/logger'
import type { JobOptions } from '@adonisjs/queue/types'
import PruneAuditEvents from '#audit/actions/prune_audit_events'

export default class PruneAuditEventsJob extends Job<{}> {
  static override options: JobOptions = {
    maxRetries: 3,
  }

  async execute() {
    const deleted = await new PruneAuditEvents().handle({ retentionDays: auditRetentionDays })

    logger.info(`Deleted ${deleted} audit events`)
  }
}
