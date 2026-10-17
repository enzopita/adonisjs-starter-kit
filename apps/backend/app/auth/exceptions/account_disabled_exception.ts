import { Exception } from '@adonisjs/core/exceptions'

export default class AccountDisabledException extends Exception {
  static override status = 403
  static override code = 'E_ACCOUNT_DISABLED'
  static override message = 'This account is disabled'
}
