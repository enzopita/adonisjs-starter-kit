import { BaseTransformer } from '@adonisjs/core/transformers';

import type Tenant from '#tenancy/models/tenant';

export default class TenantTransformer extends BaseTransformer<Tenant> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'name',
      'suspendedAt',
      'createdAt',
      'updatedAt',
    ]);
  }
}
