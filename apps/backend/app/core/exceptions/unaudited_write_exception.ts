import { Exception } from '@adonisjs/core/exceptions'

export default class UnauditedWriteException extends Exception {
  static override status = 500
  static override code = 'E_UNAUDITED_WRITE'
  static override message =
    'A write answered 2xx without recording an audit event: call audit.record() in its action'
}
