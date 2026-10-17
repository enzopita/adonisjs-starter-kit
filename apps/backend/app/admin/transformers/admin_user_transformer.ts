import { BaseTransformer } from '@adonisjs/core/transformers'
import type { UserRow } from '#admin/queries/list_users'
import UserTransformer from '#users/transformers/user_transformer'

export default class AdminUserTransformer extends BaseTransformer<UserRow> {
  toObject() {
    const { user, platformAdmin, tenantCount } = this.resource

    return {
      // Depth 2: user -> avatar. A top-level paginator's own depth() doesn't reach the inferred
      // response type, so the item carries it.
      user: UserTransformer.transform(user).depth(2),
      disabledAt: user.disabledAt,
      platformAdmin,
      tenantCount,
    }
  }
}
