import { BaseTransformer } from '@adonisjs/core/transformers'
import type { TenantMemberRow } from '#admin/queries/get_tenant'
import UserTransformer from '#users/transformers/user_transformer'

export default class AdminMemberTransformer extends BaseTransformer<TenantMemberRow> {
  toObject() {
    const { user, platformAdmin, role } = this.resource

    return {
      user: UserTransformer.transform(user).depth(2),
      disabledAt: user.disabledAt,
      platformAdmin,
      role,
    }
  }
}
