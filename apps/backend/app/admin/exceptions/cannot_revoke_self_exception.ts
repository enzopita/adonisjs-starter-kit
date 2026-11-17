import ApiException from '#core/exceptions/api_exception';

/** The caller tried to revoke their own access */
export default class CannotRevokeSelfException extends ApiException<'E_CANNOT_REVOKE_SELF'> {
  static override status = 409;
  static override code = 'E_CANNOT_REVOKE_SELF';
  static override message = 'Platform admins can’t revoke their own access';
}
