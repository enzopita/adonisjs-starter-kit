import { BaseCheck, Result } from '@adonisjs/core/health';
import type { HealthCheckResult } from '@adonisjs/core/types/health';
import drive from '@adonisjs/drive/services/main';

export class StorageCheck extends BaseCheck {
  name = 'Storage check';

  async run(): Promise<HealthCheckResult> {
    try {
      // A listing, unlike a HEAD on a key, fails when the bucket itself is missing.
      // Every key sits under a prefix (`attachments/`), so a root listing stays one entry.
      await drive.use().listAll('');

      return Result.ok('Successfully listed the storage bucket');
    } catch (error) {
      return Result.failed(
        'Unable to list the storage bucket',
        error instanceof Error ? error : undefined
      );
    }
  }
}
