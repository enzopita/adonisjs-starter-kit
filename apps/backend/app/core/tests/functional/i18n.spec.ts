import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

import { signUp } from '#tests/accounts';

const wrongCredentials = {
  email: 'nobody@example.com',
  password: 'wrong-password',
};

test.group('Core | i18n', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction());

  test('answers framework and validation errors in the Accept-Language locale', async ({
    client,
  }) => {
    const signIn = await client
      .visit('auth.access_tokens.store')
      .header('accept-language', 'pt-PT,pt;q=0.9')
      .json(wrongCredentials);

    signIn.assertStatus(400);
    signIn.assertBodyContains({
      code: 'E_INVALID_CREDENTIALS',
      message: 'E-mail ou senha inválidos.',
    });

    const invalidSignUp = await client
      .visit('auth.new_account.store')
      .header('accept-language', 'pt-BR')
      .json({
        fullName: null,
        email: 'ada@example.com',
        password: 'short',
        passwordConfirmation: 'short',
      });

    invalidSignUp.assertStatus(422);
    invalidSignUp.assertBodyContains({
      errors: [
        {
          field: 'password',
          rule: 'minLength',
          message: 'Use pelo menos 8 caracteres.',
        },
      ],
    });
  });

  test('translates an exception by its code and keeps the code', async ({
    client,
  }) => {
    const token = await signUp(client, 'ada@example.com');

    const response = await client
      .visit('invitation_accept.store')
      .header('accept-language', 'pt-BR')
      .bearerToken(token)
      .json({ token: 'unknown' });

    response.assertStatus(404);
    response.assertBodyContains({
      code: 'E_INVITATION_NOT_FOUND',
      message: 'Este convite não existe ou expirou.',
    });
  });

  test('answers in en-US when no Accept-Language locale is supported', async ({
    client,
  }) => {
    const response = await client
      .visit('auth.access_tokens.store')
      .header('accept-language', 'fr-FR,de;q=0.5')
      .json(wrongCredentials);

    response.assertBodyContains({
      code: 'E_INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
  });
});
