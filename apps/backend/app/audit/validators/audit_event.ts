import vine from '@vinejs/vine'

const date = () => vine.date({ formats: ['iso8601'] })

const page = () => vine.number().withoutDecimals().min(1).optional()
const perPage = () => vine.number().withoutDecimals().range([1, 100]).optional()

export const listAuditEventsValidator = vine.create({
  page: page(),
  perPage: perPage(),
  type: vine.array(vine.string()).optional(),
  actorId: vine.string().uuid().optional(),
  subjectType: vine.string().optional(),
  subjectId: vine.string().uuid().optional(),
  from: date().optional(),
  to: date().optional(),
})

export const listAccountActivityValidator = vine.create({
  page: page(),
  perPage: perPage(),
})
