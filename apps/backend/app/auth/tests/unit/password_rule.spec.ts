import { test } from '@japa/runner';
import { errors } from '@vinejs/vine';

import { resetPasswordValidator } from '#auth/validators/auth';

const body = (password: string) => ({
  token: 'abc',
  password,
  passwordConfirmation: password,
});

// Regression: a password manager's long passphrase is refused, or the cap disappears.
test.group('Auth | password rule', () => {
  test('accepts {length} characters')
    .with([{ length: 8 }, { length: 128 }])
    .run(async ({ assert }, { length }) => {
      const password = 'x'.repeat(length);
      const validated = await resetPasswordValidator.validate(body(password));

      assert.equal(validated.password, password);
    });

  test('rejects {length} characters')
    .with([{ length: 7 }, { length: 129 }])
    .run(async ({ assert }, { length }) => {
      await assert.rejects(
        () => resetPasswordValidator.validate(body('x'.repeat(length))),
        errors.E_VALIDATION_ERROR
      );
    });
});
