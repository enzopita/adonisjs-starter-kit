import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * A pending or expired invitation blocked deleting its role with "move its members" though nobody
 * held it. The invitation now loses its role instead. Only `role_id` is nulled: `tenant_id` is in
 * the key too and must stay (Postgres 15+ column list).
 */
export default class extends BaseSchema {
  protected tableName = 'invitations'

  override async up() {
    this.schema.raw(`
      ALTER TABLE invitations
        DROP CONSTRAINT invitations_role_id_tenant_id_foreign,
        ADD CONSTRAINT invitations_role_id_tenant_id_foreign
          FOREIGN KEY (role_id, tenant_id) REFERENCES roles (id, tenant_id)
          ON DELETE SET NULL (role_id)
    `)
  }

  override async down() {
    this.schema.raw(`
      ALTER TABLE invitations
        DROP CONSTRAINT invitations_role_id_tenant_id_foreign,
        ADD CONSTRAINT invitations_role_id_tenant_id_foreign
          FOREIGN KEY (role_id, tenant_id) REFERENCES roles (id, tenant_id)
    `)
  }
}
