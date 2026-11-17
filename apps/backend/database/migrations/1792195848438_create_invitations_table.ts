import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'invitations';

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'));
      table
        .uuid('tenant_id')
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
        .index();
      table.string('email', 254).notNullable();
      table.check('email = lower(email)');
      table.uuid('role_id').nullable();
      // The role belongs to the same tenant and can't be deleted while a pending invitation
      // carries it: no ON DELETE, same as role_assignments. A NULL role_id skips the check
      // (Postgres's default MATCH SIMPLE).
      table
        .foreign(['role_id', 'tenant_id'])
        .references(['id', 'tenant_id'])
        .inTable('roles');
      table.string('token_hash').notNullable().unique();
      table
        .uuid('invited_by_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.timestamp('expires_at').notNullable();
      table.unique(['tenant_id', 'email']);

      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    });
  }

  override async down() {
    this.schema.dropTable(this.tableName);
  }
}
