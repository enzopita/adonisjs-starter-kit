import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import GrantPlatformAdmin from '#admin/actions/grant_platform_admin'

export default class GrantPlatformAdminCommand extends BaseCommand {
  static override commandName = 'admin:grant'
  static override description = 'Make the user with this email a platform admin'

  static override options: CommandOptions = { startApp: true }

  @args.string({ description: 'Email of an existing user' })
  declare email: string

  override async run() {
    const result = await new GrantPlatformAdmin().handle({ email: this.email })

    if (!result) {
      this.logger.error(`No user has the email ${this.email}`)
      this.exitCode = 1

      return
    }

    this.logger.info(
      result.granted
        ? `${result.user.email} is now a platform admin`
        : `${result.user.email} is already a platform admin`,
    )
  }
}
