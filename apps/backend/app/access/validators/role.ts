import vine from '@vinejs/vine'
import Role from '#access/models/role'
import { ASSIGNABLE_PERMISSIONS } from '#access/permissions'

const params = vine.object({ id: vine.string().uuid() })

const permissions = vine.array(vine.enum(ASSIGNABLE_PERMISSIONS)).distinct()

const name = vine.string().trim().minLength(1).maxLength(255)

export const createRoleValidator = vine.create({
  name: name.clone().unique(async (_db, value) => !(await Role.findBy('name', value))),
  permissions,
})

export const updateRoleValidator = vine.create({
  params,
  name: name.clone().unique(async (_db, value, field) => {
    // SAFETY: vine types FieldContext.data as any; the route's uuid matcher guarantees params.id.
    const taken = await Role.query()
      .where('name', value)
      .whereNot('id', (field.data as { params: { id: string } }).params.id)
      .first()

    return !taken
  }),
  permissions,
})

export const roleParamsValidator = vine.create({ params })
