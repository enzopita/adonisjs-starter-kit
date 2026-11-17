import i18nManager from '@adonisjs/i18n/services/main';
import { test } from '@japa/runner';

async function keysOf(locale: string) {
  await i18nManager.loadTranslations();

  return Object.keys(i18nManager.getTranslationsFor(locale)).toSorted();
}

test.group('Core | translations', () => {
  test('pt-BR translates exactly the keys en-US defines', async ({
    assert,
  }) => {
    assert.deepEqual(await keysOf('pt-BR'), await keysOf('en-US'));
  });
});
