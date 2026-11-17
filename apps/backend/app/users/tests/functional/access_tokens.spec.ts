import { test } from '@japa/runner';

test.group('Users | access tokens', () => {
  test('rejects a token whose identifier is not a uuid', async ({ client }) => {
    const encode = (value: string) => Buffer.from(value).toString('base64url');

    const response = await client
      .get('/api/v1/account/profile')
      .bearerToken(`oat_${encode('1')}.${encode('secret')}`);

    response.assertStatus(401);
  });
});
