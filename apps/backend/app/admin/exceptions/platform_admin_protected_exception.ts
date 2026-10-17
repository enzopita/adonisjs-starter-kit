import { Exception } from '@adonisjs/core/exceptions'

export default class PlatformAdminProtectedException extends Exception {
  static override status = 409
  static override code = 'E_PLATFORM_ADMIN_PROTECTED'
  static override message = 'Platform admins can’t be disabled or impersonated'
}
