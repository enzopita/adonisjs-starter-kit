import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'role_assignments';

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
      table.uuid('role_id').notNullable();
      table.unique(['tenant_id', 'user_id']);
      // The role belongs to the same tenant and can't be deleted while assigned: no ON DELETE,
      // checked at the end of the statement so deleting a tenant still cascades through its
      // roles and assignments together.
      table
        .foreign(['role_id', 'tenant_id'])
        .references(['id', 'tenant_id'])
        .inTable('roles');
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
