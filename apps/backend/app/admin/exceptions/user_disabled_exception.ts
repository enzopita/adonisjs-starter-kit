import { Exception } from '@adonisjs/core/exceptions'

export default class UserDisabledException extends Exception {
  static override status = 409
  static override code = 'E_USER_DISABLED'
  static override message = 'Enable this account before impersonating it'
}
