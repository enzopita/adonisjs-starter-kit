import vine from '@vinejs/vine';

import { pagination } from '#core/validators/pagination';

export const listUsersValidator = vine.create({
  search: vine.string().trim().maxLength(255).optional(),
  ...pagination(),
});

export const userParamsValidator = vine.create({
  params: vine.object({ id: vine.string().uuid() }),
});
