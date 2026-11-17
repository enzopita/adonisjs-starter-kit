import { BaseSchema } from '@adonisjs/lucid/schema';

/**
 * Tokens issued before the sliding idle timeout have a null `expires_at`, which the app now
 * reads as "never expires". Backfilling a real expiry from the token's own activity makes the
 * 30-day rule hold for everyone instead of only new sign-ins. Impersonation tokens already carry
 * their own 1-hour `expires_at` and are left alone.
 */
export default class extends BaseSchema {
  override async up() {
    this.defer((db) =>
      db.rawQuery(`
        UPDATE auth_access_tokens
        SET expires_at = COALESCE(last_used_at, created_at) + INTERVAL '30 days'
        WHERE expires_at IS NULL AND impersonator_id IS NULL
      `)
    );
  }

  override async down() {
    // Not worth reversing: it only widens a null expiry that the app no longer honors as "never".
  }
}
