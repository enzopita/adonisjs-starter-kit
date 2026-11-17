import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens';

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('user_agent').nullable();
      table.string('ip_address').nullable();
    });
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('user_agent');
      table.dropColumn('ip_address');
    });
  }
}
