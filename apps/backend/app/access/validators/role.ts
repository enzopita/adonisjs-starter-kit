import vine from '@vinejs/vine';

import Role from '#access/models/role';
import { ASSIGNABLE_PERMISSIONS } from '#access/permissions';

const params = vine.object({ id: vine.string().uuid() });

const permissions = vine.array(vine.enum(ASSIGNABLE_PERMISSIONS)).distinct();

const name = vine.string().trim().minLength(1).maxLength(255);

export const createRoleValidator = vine.create({
  name: name
    .clone()
    .unique(async (_db, value) => !(await Role.findBy('name', value))),
  permissions,
});

export const updateRoleValidator = vine.create({
  params,
  name: name.clone().unique(async (_db, value, field) => {
    const taken = await Role.query()
      .where('name', value)
      // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access -- vine types FieldContext.data as any; the uuid route matcher guarantees params.id.
      .whereNot('id', field.data.params.id)
      .first();

    return !taken;
  }),
  permissions,
});

export const roleParamsValidator = vine.create({ params });
