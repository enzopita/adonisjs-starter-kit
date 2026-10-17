import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#tenancy/types/audit'
import Tenant from '#tenancy/models/tenant'
import emitter from '@adonisjs/core/services/emitter'
import type { TenantCreated } from '#tenancy/types/events'

export interface CreateTenantInput {
  name: string
  creatorId: string
  locale: string
}

export default class CreateTenant {
  /** Awaits the listeners: a failing one fails the request, after the tenant is committed. */
  async handle({ name, creatorId, locale }: CreateTenantInput) {
    const tenant = await db.transaction(async trx => {
      const created = await Tenant.create({ name }, { client: trx })
      await created.related('memberships').create({ userId: creatorId })

      await audit.record(trx, 'tenant.created', {
        tenantId: created.id,
        subject: { type: 'tenant', id: created.id },
        data: { name },
      })

      return created
    })

    await emitter.emit('tenancy:tenant_created', {
      tenantId: tenant.id,
      creatorId,
      locale,
    } satisfies TenantCreated)

    return tenant
  }
}
