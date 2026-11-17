import db from '@adonisjs/lucid/services/db';

import type {} from '#admin/types/audit';
import { audit } from '#core/audit/main';
import Tenant from '#tenancy/models/tenant';

export interface RenameTenantInput {
  id: string;
  name: string;
}

export default class RenameTenant {
  async handle({ id, name }: RenameTenantInput) {
    return await db.transaction(async (trx) => {
      const tenant = await Tenant.findOrFail(id, { client: trx });
      const from = tenant.name;

      tenant.name = name;
      await tenant.save();

      await audit.record(trx, 'admin.tenant_renamed', {
        tenantId: tenant.id,
        subject: { type: 'tenant', id: tenant.id },
        data: { from, to: name },
      });

      return tenant;
    });
  }
}
