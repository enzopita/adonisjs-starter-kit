import { Exception } from '@adonisjs/core/exceptions'

export default class CannotRevokeSelfException extends Exception {
  static override status = 409
  static override code = 'E_CANNOT_REVOKE_SELF'
  static override message = 'Platform admins can’t revoke their own access'
}
