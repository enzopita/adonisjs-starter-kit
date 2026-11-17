import vine from '@vinejs/vine';
import type { FieldContext } from '@vinejs/vine/types';

import { supportedLocales } from '#config/i18n';

/**
 * `Intl.supportedValuesOf('timeZone')` lists only the canonical IANA names, missing aliases
 * browsers report (`Asia/Kolkata`, `Etc/UTC`, `Etc/GMT+5`...). `Intl.DateTimeFormat` accepts
 * every alias and resolves it to the canonical name, so it is the source of truth here: it
 * throws RangeError for an unknown zone and otherwise tells us the name to store.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- the I/O boundary VineJS calls with the raw field value; chained after vine.string(), so a non-string never reaches it.
function timezone(value: unknown, _options: unknown, field: FieldContext) {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- vine.string() already parsed this field; the signature VineJS requires still types it as `unknown`.
  if (typeof value !== 'string') {
    return;
  }

  try {
    const canonical = new Intl.DateTimeFormat('en', {
      timeZone: value,
    }).resolvedOptions().timeZone;

    field.mutate(canonical, field);
  } catch {
    field.report(
      'The {{ field }} field must be a valid time zone',
      'timezone',
      field
    );
  }
}

const timezoneRuleImpl = vine.createRule(timezone);

export const localeRule = () => vine.enum(supportedLocales);
export const timezoneRule = () => vine.string().use(timezoneRuleImpl());

export const updateAvatarValidator = vine.create({
  attachmentId: vine.string().uuid().nullable(),
});

/** Partial: a request sends either field or both, never neither. */
export const updateProfileValidator = vine.create({
  locale: localeRule().optional().requiredIfMissing('timezone'),
  timezone: timezoneRule().optional().requiredIfMissing('locale'),
});
