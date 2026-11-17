import vine from '@vinejs/vine';

import { pagination } from '#core/validators/pagination';

const params = vine.object({ id: vine.string().uuid() });

export const listTenantsValidator = vine.create({
  search: vine.string().trim().maxLength(255).optional(),
  ...pagination(),
});

export const renameTenantValidator = vine.create({
  params,
  name: vine.string().trim().minLength(1).maxLength(255),
});

export const tenantParamsValidator = vine.create({ params });
