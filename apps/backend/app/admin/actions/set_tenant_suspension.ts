import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#admin/types/audit'
import Tenant from '#tenancy/models/tenant'

export interface SetTenantSuspensionInput {
  id: string
  suspended: boolean
}

export default class SetTenantSuspension {
  /** Suspending a suspended tenant keeps the date it was first suspended. */
  async handle({ id, suspended }: SetTenantSuspensionInput) {
    return db.transaction(async trx => {
      const tenant = await Tenant.findOrFail(id, { client: trx })

      tenant.suspendedAt = suspended ? (tenant.suspendedAt ?? DateTime.now()) : null
      await tenant.save()

      await audit.record(trx, suspended ? 'admin.tenant_suspended' : 'admin.tenant_reactivated', {
        tenantId: tenant.id,
        subject: { type: 'tenant', id: tenant.id },
        data: { name: tenant.name },
      })

      return tenant
    })
  }
}
