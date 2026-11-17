import { BaseSchema } from '@adonisjs/lucid/schema';

/** The nightly prune walks expired sessions by expiry; without this each batch scans the table. */
export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens';

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['expires_at']);
    });
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['expires_at']);
    });
  }
}
