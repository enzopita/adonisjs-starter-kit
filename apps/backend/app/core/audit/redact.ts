import type { JsonObject, JsonValue } from '#core/audit/types';

const REDACTED_KEYS = new Set([
  'password',
  'tokenHash',
  'token_hash',
  'token',
  'hash',
  'secret',
]);

/** The event data as stored: JSON, with every secret-named key at any depth replaced. */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- callers pass DataOf<T>, which `object` rejects, and anti-slop rules out `unknown`.
export function redact<T>(data: T): JsonObject {
  // SAFETY: AuditEntry.data is an object, and JSON round-trips an object to an object.
  return JSON.parse(JSON.stringify(data), (key, value: JsonValue) =>
    REDACTED_KEYS.has(key) ? '[redacted]' : value
  ) as JsonObject;
}
