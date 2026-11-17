import vine from '@vinejs/vine';

export const sessionParamsValidator = vine.create({
  params: vine.object({ id: vine.string().uuid() }),
});
