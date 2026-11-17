import type { HttpContext } from '@adonisjs/core/http';

import ListAuditEvents from '#audit/queries/list_audit_events';
import AuditEventTransformer from '#audit/transformers/audit_event_transformer';
import { listAccountActivityValidator } from '#audit/validators/audit_event';

/**
 * @tags Account
 */
export default class AccountActivityController {
  /**
   * List the signed-in user's account activity
   *
   * Events on the signed-in user's account outside any tenant, newest first: the ones they
   * performed, such as sign-ins and profile changes, and the ones performed on their account, such
   * as a platform admin disabling it.
   */
  async index({ auth, request, serialize }: HttpContext) {
    const pages = await request.validateUsing(listAccountActivityValidator);

    const { rows, meta } = await new ListAuditEvents().handle({
      trail: { accountOf: auth.getUserOrFail().id },
      ...pages,
    });

    return serialize(
      AuditEventTransformer.paginate(rows, meta).useVariant('forAccount')
    );
  }
}
