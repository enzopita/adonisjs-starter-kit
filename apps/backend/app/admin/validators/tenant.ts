import vine from '@vinejs/vine'

const params = vine.object({ id: vine.string().uuid() })

export const listTenantsValidator = vine.create({
  search: vine.string().trim().maxLength(255).optional(),
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().withoutDecimals().range([1, 100]).optional(),
})

export const renameTenantValidator = vine.create({
  params,
  name: vine.string().trim().minLength(1).maxLength(255),
})

export const tenantParamsValidator = vine.create({ params })
