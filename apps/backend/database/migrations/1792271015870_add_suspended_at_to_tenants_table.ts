import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  override async up() {
    this.schema.alterTable(this.tableName, table => {
      table.timestamp('suspended_at').nullable()
    })
  }

  override async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('suspended_at')
    })
  }
}
