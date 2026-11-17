import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Encrypted with APP_KEY. Set and unconfirmed while enrolling: only a confirmed secret counts.
      table.text('two_factor_secret').nullable();
      table.timestamp('two_factor_confirmed_at').nullable();
      // The last TOTP time step accepted, so a code is refused at or before it (replay).
      table.integer('two_factor_last_step').nullable();
      table.check(
        'two_factor_confirmed_at is null or two_factor_secret is not null',
        {},
        'users_two_factor_confirmed_has_secret'
      );
    });
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns(
        'two_factor_secret',
        'two_factor_confirmed_at',
        'two_factor_last_step'
      );
    });
  }
}
