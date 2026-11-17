import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

import { currentAuditScope } from '#core/audit/scope';
import type { UnauditedReason } from '#core/audit/scope';

/** Marks a route that is no person's action and keeps its own trail, such as a provider callback. */
export default class UnauditedMiddleware {
  handle(
    _ctx: HttpContext,
    next: NextFn,
    options: { reason: UnauditedReason }
  ) {
    const scope = currentAuditScope();

    if (scope) {
      scope.unaudited = options.reason;
    }

    return next();
  }
}
