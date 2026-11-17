import app from '@adonisjs/core/services/app';

import PruneAttachmentsJob from '#attachments/jobs/prune_attachments';
import PruneAuditEventsJob from '#audit/jobs/prune_audit_events';
import PruneExpiredTokensJob from '#auth/jobs/prune_expired_tokens';

// `node ace codegen` imports this file in "warmup" mode, where the queue manager is never
// initialized or shut down, and a schedule is a write to the queue backend.
if (app.getMode() === 'run') {
  await PruneAttachmentsJob.schedule({}).cron('0 3 * * *');

  await PruneAuditEventsJob.schedule({}).cron('30 3 * * *');

  await PruneExpiredTokensJob.schedule({}).cron('15 3 * * *');
}
