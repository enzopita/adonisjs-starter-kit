import vine from '@vinejs/vine'

export const listUsersValidator = vine.create({
  search: vine.string().trim().maxLength(255).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().withoutDecimals().range([1, 100]).optional(),
})

export const userParamsValidator = vine.create({
  params: vine.object({ id: vine.string().uuid() }),
})
