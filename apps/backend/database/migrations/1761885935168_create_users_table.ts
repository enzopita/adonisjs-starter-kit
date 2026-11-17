import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'));
      table.string('full_name').nullable();
      table.string('email', 254).notNullable().unique();
      table.check('email = lower(email)');
      table.string('password').notNullable();

      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    });
  }

  override async down() {
    this.schema.dropTable(this.tableName);
  }
}
