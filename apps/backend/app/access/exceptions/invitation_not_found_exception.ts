import ApiException from '#core/exceptions/api_exception';

/** The invitation is unknown, already used, or expired */
export default class InvitationNotFoundException extends ApiException<'E_INVITATION_NOT_FOUND'> {
  static override status = 404;
  static override code = 'E_INVITATION_NOT_FOUND';
  static override message = 'This invitation is unknown or has expired';
}
