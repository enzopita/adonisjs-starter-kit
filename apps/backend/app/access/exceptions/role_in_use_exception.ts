import ApiException from '#core/exceptions/api_exception';

/** The role is still assigned to a member */
export default class RoleInUseException extends ApiException<'E_ROLE_IN_USE'> {
  static override status = 409;
  static override code = 'E_ROLE_IN_USE';
  static override message =
    'Assign another role to its members before deleting this role';
}
