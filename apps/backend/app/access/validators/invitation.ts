import vine from '@vinejs/vine';

import Role from '#access/models/role';
import { existsInTenant } from '#tenancy/validators/exists_in_tenant';

export const inviteMemberValidator = vine.create({
  email: vine.string().email().maxLength(254).toLowerCase(),
  roleId: vine.string().uuid().exists(existsInTenant(Role)).nullable(),
});

export const invitationParamsValidator = vine.create({
  params: vine.object({ id: vine.string().uuid() }),
});

export const acceptInvitationValidator = vine.create({
  token: vine.string(),
});
