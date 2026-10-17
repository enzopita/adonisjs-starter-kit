import { BaseTransformer } from '@adonisjs/core/transformers'
import type { TenantRow } from '#admin/queries/list_tenants'

export default class AdminTenantTransformer extends BaseTransformer<TenantRow> {
  toObject() {
    return {
      ...this.pick(this.resource.tenant, ['id', 'name', 'suspendedAt', 'createdAt']),
      memberCount: this.resource.memberCount,
    }
  }
}
