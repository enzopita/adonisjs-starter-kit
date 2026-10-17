import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_events'

  override async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      // Null for account events (login, sign-up), which belong to no tenant.
      table.uuid('tenant_id').nullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.uuid('actor_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      // The access token's id, with no foreign key: logout deletes the token, the trail keeps it.
      table.uuid('session_id').nullable()
      table.string('request_id').nullable()
      table.string('ip', 45).nullable()
      table.string('user_agent', 512).nullable()
      table.string('type').notNullable()
      table.string('subject_type').nullable()
      table.uuid('subject_id').nullable()
      table.jsonb('data').notNullable().defaultTo('{}')
      table.index(['tenant_id', 'id'])
      table.index(['tenant_id', 'subject_type', 'subject_id', 'id'])
      table.index(['tenant_id', 'actor_id', 'id'])

      table.timestamp('created_at').notNullable()
    })
  }

  override async down() {
    this.schema.dropTable(this.tableName)
  }
}
