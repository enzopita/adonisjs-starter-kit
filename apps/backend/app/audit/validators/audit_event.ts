import vine from '@vinejs/vine'

const date = () => vine.date({ formats: ['iso8601'] })

export const listAuditEventsValidator = vine.create({
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().withoutDecimals().range([1, 100]).optional(),
  type: vine.array(vine.string()).optional(),
  actorId: vine.string().uuid().optional(),
  subjectType: vine.string().optional(),
  subjectId: vine.string().uuid().optional(),
  from: date().optional(),
  to: date().optional(),
})
