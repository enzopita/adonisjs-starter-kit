import { BaseTransformer } from '@adonisjs/core/transformers';

import type Role from '#access/models/role';
import { isAssignable } from '#access/permissions';

export default class RoleTransformer extends BaseTransformer<Role> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'createdAt', 'updatedAt']),
      permissions: this.resource.permissions.filter(isAssignable),
    };
  }
}
