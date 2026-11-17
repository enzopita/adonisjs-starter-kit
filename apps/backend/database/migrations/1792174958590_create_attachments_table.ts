import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'attachments';

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'));
      // No FK to users: attachments must not depend on any consumer, even in the schema.
      table.uuid('uploader_id').notNullable().index();
      table.string('name', 255).notNullable();
      table.string('extname').notNullable();
      table.string('mime_type').notNullable();
      table.integer('size').notNullable();

      table.timestamp('created_at').notNullable();
    });
  }

  override async down() {
    this.schema.dropTable(this.tableName);
  }
}
