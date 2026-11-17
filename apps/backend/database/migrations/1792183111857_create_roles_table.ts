import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'roles';

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'));
      table
        .uuid('tenant_id')
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE');
      table.string('name').notNullable();
      table.specificType('permissions', 'text[]').notNullable().defaultTo('{}');
      table.unique(['tenant_id', 'name']);
      table.unique(['id', 'tenant_id']);

      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    });
  }

  override async down() {
    this.schema.dropTable(this.tableName);
  }
}
