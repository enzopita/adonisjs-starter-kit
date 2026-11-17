import ApiException from '#core/exceptions/api_exception';

/** The email already belongs to a member of the tenant */
export default class AlreadyMemberException extends ApiException<'E_ALREADY_MEMBER'> {
  static override status = 409;
  static override code = 'E_ALREADY_MEMBER';
  static override message =
    'This email already belongs to a member of this tenant';
}
