import { BaseTransformer } from '@adonisjs/core/transformers';

import Invitation from '#access/models/invitation';

export default class InvitationTransformer extends BaseTransformer<Invitation> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'email',
      'roleId',
      'expiresAt',
      'createdAt',
    ]);
  }
}
