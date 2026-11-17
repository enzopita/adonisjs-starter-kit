import vine from '@vinejs/vine';

export const createTenantValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
});
