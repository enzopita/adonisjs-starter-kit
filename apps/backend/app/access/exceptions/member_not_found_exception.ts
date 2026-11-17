import ApiException from '#core/exceptions/api_exception';

/** The user is not a member of the tenant */
export default class MemberNotFoundException extends ApiException<'E_MEMBER_NOT_FOUND'> {
  static override status = 404;
  static override code = 'E_MEMBER_NOT_FOUND';
  static override message = 'This user is not a member';
}
