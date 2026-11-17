import { hasMany } from '@adonisjs/lucid/orm';
import type { HasMany } from '@adonisjs/lucid/types/relations';

import { TenantSchema } from '#database/schema';
import TenantMembership from '#tenancy/models/tenant_membership';

export default class Tenant extends TenantSchema {
  @hasMany(() => TenantMembership)
  declare memberships: HasMany<typeof TenantMembership>;
}
