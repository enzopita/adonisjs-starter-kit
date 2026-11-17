import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('avatar_attachment_id')
        .nullable()
        .references('id')
        .inTable('attachments');
    });
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('avatar_attachment_id');
    });
  }
}
