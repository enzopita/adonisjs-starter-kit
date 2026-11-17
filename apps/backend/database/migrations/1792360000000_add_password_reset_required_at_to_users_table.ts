import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('password_reset_required_at').nullable();
    });
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('password_reset_required_at');
    });
  }
}
