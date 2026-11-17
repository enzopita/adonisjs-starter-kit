import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'two_factor_recovery_codes';

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'));
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('code_hash').notNullable();
      table.unique(['user_id', 'code_hash']);

      table.timestamp('created_at').notNullable();
    });
  }

  override async down() {
    this.schema.dropTable(this.tableName);
  }
}
