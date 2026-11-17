import { BaseCommand, args } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

import ResetTwoFactor from '#admin/actions/reset_two_factor';
import UserDisabledException from '#admin/exceptions/user_disabled_exception';
import TwoFactorNotEnabledException from '#auth/exceptions/two_factor_not_enabled_exception';
import User from '#users/models/user';

export default class ResetTwoFactorCommand extends BaseCommand {
  static override commandName = 'admin:reset-two-factor';
  static override description =
    'Turn off the two-factor of the user with this email, sign them out everywhere and mail them a link to choose a new password';

  static override options: CommandOptions = { startApp: true };

  @args.string({
    description: 'Email of an existing user, platform admins included',
  })
  declare email: string;

  override async run() {
    const user = await User.findBy('email', this.email.toLowerCase());

    if (!user) {
      this.logger.error(`No user has the email ${this.email}`);
      this.exitCode = 1;

      return;
    }

    try {
      const { revoked } = await new ResetTwoFactor().handle({
        id: user.id,
        protectPlatformAdmins: false,
      });

      this.logger.info(
        `Two-factor is off for ${user.email}: ${revoked} session(s) signed out, user emailed a link to choose a new password before signing in`
      );
    } catch (error) {
      if (error instanceof TwoFactorNotEnabledException) {
        this.logger.error(`${user.email} doesn’t have two-factor enabled`);
      } else if (error instanceof UserDisabledException) {
        this.logger.error(
          `${user.email} is disabled: enable the account first`
        );
      } else {
        throw error;
      }

      this.exitCode = 1;
    }
  }
}
