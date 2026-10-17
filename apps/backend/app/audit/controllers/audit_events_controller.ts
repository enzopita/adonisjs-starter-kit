import { can } from '#access/abilities'
import { PERMISSIONS } from '#access/permissions'
import type { HttpContext } from '@adonisjs/core/http'
import ListAuditEvents from '#audit/queries/list_audit_events'
import { SUBJECT_PERMISSIONS } from '#audit/subject_permissions'
import { listAuditEventsValidator } from '#audit/validators/audit_event'
import AuditEventTransformer from '#audit/transformers/audit_event_transformer'

export default class AuditEventsController {
  /** The tenant's whole trail needs audit.view; one subject type's, its feature's permission. */
  async index({ bouncer, request, tenant, serialize }: HttpContext) {
    const { page, perPage, type, ...filters } =
      await request.validateUsing(listAuditEventsValidator)

    const subjectPermission = filters.subjectType && SUBJECT_PERMISSIONS.get(filters.subjectType)

    const allowed =
      (await bouncer.allows(can, PERMISSIONS.auditView)) ||
      (!!subjectPermission && (await bouncer.allows(can, subjectPermission)))

    if (!allowed) await bouncer.authorize(can, PERMISSIONS.auditView)

    const { rows, meta } = await new ListAuditEvents().handle({
      tenantId: tenant.id,
      page: page ?? 1,
      perPage: perPage ?? 20,
      types: type,
      ...filters,
    })

    return serialize(AuditEventTransformer.paginate(rows, meta))
  }
}
