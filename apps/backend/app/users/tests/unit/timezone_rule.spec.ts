import { test } from '@japa/runner';
import vine, { errors } from '@vinejs/vine';

import { timezoneRule } from '#users/validators/user';

const validator = vine.create({ timezone: timezoneRule() });

// Regression: Intl.supportedValuesOf('timeZone') lacks aliases browsers report (Asia/Kolkata,
// Etc/GMT+5), so a real browser's own zone was refused; or an unknown name gets stored.
test.group('Users | timezoneRule', () => {
  test('{timezone} is stored as {stored}')
    .with([
      { timezone: 'America/Sao_Paulo', stored: 'America/Sao_Paulo' },
      { timezone: 'Asia/Kolkata', stored: 'Asia/Calcutta' },
      { timezone: 'Etc/GMT+5', stored: 'Etc/GMT+5' },
    ])
    .run(async ({ assert }, { timezone, stored }) => {
      assert.deepEqual(await validator.validate({ timezone }), {
        timezone: stored,
      });
    });

  test('rejects a name no time zone has', async ({ assert }) => {
    await assert.rejects(
      () => validator.validate({ timezone: 'Mars/Olympus_Mons' }),
      errors.E_VALIDATION_ERROR
    );
  });
});
