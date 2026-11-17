import type { LucidModel } from '@adonisjs/lucid/types/model';
import type { VineDbSearchCallback } from '@adonisjs/lucid/types/vine';

/**
 * An `exists` callback that looks the id up through the model, so the tenant
 * scope applies: `exists({ table })` queries the table directly and would
 * accept another tenant's id.
 *
 * @example vine.string().uuid().exists(existsInTenant(Project))
 */
export function existsInTenant(
  model: LucidModel & { prototype: { tenantId: string } }
): VineDbSearchCallback<string> {
  return async (_db, value) => {
    const row = await model.query().where(model.primaryKey, value).first();

    return row !== null;
  };
}
