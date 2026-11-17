import vine from '@vinejs/vine';

import Role from '#access/models/role';
import { ASSIGNABLE_PERMISSIONS } from '#access/permissions';
import { existsInTenant } from '#tenancy/validators/exists_in_tenant';

const params = vine.object({ userId: vine.string().uuid() });

export const assignRoleValidator = vine.create({
  params,
  roleId: vine.string().uuid().exists(existsInTenant(Role)).nullable(),
});

export const replaceGrantsValidator = vine.create({
  params,
  permissions: vine.array(vine.enum(ASSIGNABLE_PERMISSIONS)).distinct(),
});
