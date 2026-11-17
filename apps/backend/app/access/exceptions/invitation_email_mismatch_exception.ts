import ApiException from '#core/exceptions/api_exception';

/** The invitation was sent to a different email */
export default class InvitationEmailMismatchException extends ApiException<'E_INVITATION_EMAIL_MISMATCH'> {
  static override status = 403;
  static override code = 'E_INVITATION_EMAIL_MISMATCH';
  static override message = 'This invitation was sent to a different email';
}
