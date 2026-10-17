import { auditRetentionDays } from '#config/app'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import PruneAuditEvents from '#audit/actions/prune_audit_events'

export default class PruneAuditEventsCommand extends BaseCommand {
  static override commandName = 'audit:prune'
  static override description = 'Delete audit events older than AUDIT_RETENTION_DAYS'

  static override options: CommandOptions = { startApp: true }

  override async run() {
    const deleted = await new PruneAuditEvents().handle({ retentionDays: auditRetentionDays })

    this.logger.info(`Deleted ${deleted} audit events`)
  }
}
