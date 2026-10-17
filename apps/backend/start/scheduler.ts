import PruneAttachmentsJob from '#attachments/jobs/prune_attachments'
import PruneAuditEventsJob from '#audit/jobs/prune_audit_events'

await PruneAttachmentsJob.schedule({}).cron('0 3 * * *')

await PruneAuditEventsJob.schedule({}).cron('30 3 * * *')
