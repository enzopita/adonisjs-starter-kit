import { BaseSchema } from '@adonisjs/lucid/schema';

/**
 * Postgres doesn't index a foreign key: listing or revoking a user's sessions, and ending an
 * admin's impersonations, each scanned the whole table.
 */
export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens';

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['tokenable_id']);
      table.index(['impersonator_id']);
    });
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['tokenable_id']);
      table.dropIndex(['impersonator_id']);
    });
  }
}
