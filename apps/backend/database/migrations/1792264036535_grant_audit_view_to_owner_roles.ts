import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Owner roles seeded before audit.view existed hold every permission of that time but not it.
 * The list is frozen here: a permission added to the catalog later must not widen this grant.
 */
const OWNER_PERMISSIONS = ['roles.manage', 'members.manage']

export default class extends BaseSchema {
  override async up() {
    this.defer(db =>
      db.rawQuery(
        `
        WITH granted AS (
          UPDATE roles
          SET permissions = array_append(permissions, 'audit.view'), updated_at = now()
          WHERE permissions @> :owner::text[] AND NOT ('audit.view' = ANY (permissions))
          RETURNING id, tenant_id, name, permissions
        )
        INSERT INTO audit_events (tenant_id, type, subject_type, subject_id, data, created_at)
        SELECT tenant_id, 'role.updated', 'role', id,
          jsonb_build_object('name', name, 'changes', jsonb_build_object('permissions',
            jsonb_build_object(
              'from', to_jsonb(array_remove(permissions, 'audit.view')),
              'to', to_jsonb(permissions)))),
          now()
        FROM granted
        `,
        { owner: OWNER_PERMISSIONS },
      ),
    )
  }

  /**
   * Keeps the grant: once applied, a role's audit.view can't be told apart from one an admin
   * gave or kept on purpose, and revoking it would hide the trail from the people it is for.
   */
  override async down() {}
}
