import type { JsonObject } from '#core/audit/types';
import { AuditEventSchema } from '#database/schema';

/** Written only through `audit` from #core/audit/main, never updated or deleted. */
export default class AuditEvent extends AuditEventSchema {
  declare data: JsonObject;
}
