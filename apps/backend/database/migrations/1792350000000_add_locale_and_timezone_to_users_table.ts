import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('locale').nullable();
      table.string('timezone').nullable();
    });
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('locale');
      table.dropColumn('timezone');
    });
  }
}
