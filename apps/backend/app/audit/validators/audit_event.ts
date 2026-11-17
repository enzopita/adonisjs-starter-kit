import vine from '@vinejs/vine';

import { pagination } from '#core/validators/pagination';

const date = () => vine.date({ formats: ['iso8601'] });

export const listAuditEventsValidator = vine.create({
  ...pagination(),
  type: vine.array(vine.string()).optional(),
  actorId: vine.string().uuid().optional(),
  subjectType: vine.string().optional(),
  subjectId: vine.string().uuid().optional(),
  from: date().optional(),
  to: date().optional(),
});

export const listAccountActivityValidator = vine.create(pagination());
