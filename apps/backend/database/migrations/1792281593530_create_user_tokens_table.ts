import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'user_tokens';

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'));
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('purpose').notNullable();
      table.check(`purpose in ('password_reset', 'email_verification')`);
      table.string('token_hash').notNullable().unique();
      table.timestamp('expires_at').notNullable();
      // Issuing a token replaces the user's previous one of that purpose.
      table.unique(['user_id', 'purpose']);

      table.timestamp('created_at').notNullable();
    });
  }

  override async down() {
    this.schema.dropTable(this.tableName);
  }
}
