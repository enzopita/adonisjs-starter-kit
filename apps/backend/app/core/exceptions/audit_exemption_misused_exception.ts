import { Exception } from '@adonisjs/core/exceptions';

export default class AuditExemptionMisusedException extends Exception {
  static override status = 500;
  static override code = 'E_AUDIT_EXEMPTION_MISUSED';
  static override message =
    'A write recorded an audit event on an unaudited route or after audit.unchanged()';
}
