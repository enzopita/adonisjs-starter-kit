import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_events'

  override async up() {
    this.schema.alterTable(this.tableName, table => {
      // Who was really acting when actor_id was being impersonated.
      table
        .uuid('impersonator_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
    })
  }

  override async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('impersonator_id')
    })
  }
}
