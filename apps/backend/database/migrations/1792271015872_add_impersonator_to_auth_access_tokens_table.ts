import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  override async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('impersonator_id').nullable().references('id').inTable('users').onDelete('CASCADE')
    })
  }

  override async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('impersonator_id')
    })
  }
}
