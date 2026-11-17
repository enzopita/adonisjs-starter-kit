import { BaseTransformer } from '@adonisjs/core/transformers';

import type { MemberRow } from '#access/queries/list_members';
import UserTransformer from '#users/transformers/user_transformer';

export default class MemberTransformer extends BaseTransformer<MemberRow> {
  toObject() {
    return {
      user: UserTransformer.transform(this.resource.user),
      roleId: this.resource.roleId,
      permissions: this.resource.permissions,
    };
  }
}
