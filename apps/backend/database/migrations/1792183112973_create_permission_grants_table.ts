import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'permission_grants';

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'));
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.uuid('tenant_id').notNullable();
      table.string('permission').notNullable();
      table.unique(['tenant_id', 'user_id', 'permission']);
      table
        .foreign(['tenant_id', 'user_id'])
        .references(['tenant_id', 'user_id'])
        .inTable('tenant_memberships')
        .onDelete('CASCADE');

      table.timestamp('created_at').notNullable();
    });
  }

  override async down() {
    this.schema.dropTable(this.tableName);
  }
}
