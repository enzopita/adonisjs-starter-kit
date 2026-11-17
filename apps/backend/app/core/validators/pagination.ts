import vine from '@vinejs/vine';

/** The `page` and `perPage` fields of a paginated list; the query defaults them to 1 and 20. */
export const pagination = () => ({
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().withoutDecimals().range([1, 100]).optional(),
});
