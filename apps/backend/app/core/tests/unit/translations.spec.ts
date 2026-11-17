import { readdir, readFile } from 'node:fs/promises';

import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';

type Translations = { [key: string]: string | Translations };

function flatten(translations: Translations, prefix = ''): string[] {
  return Object.entries(translations).flatMap(([key, value]) =>
    // oxlint-disable-next-line anti-slop/no-runtime-typeof -- this walks parsed JSON, where a leaf is a string and a branch an object.
    typeof value === 'string'
      ? [`${prefix}${key}`]
      : flatten(value, `${prefix}${key}.`)
  );
}

async function keysOf(locale: string) {
  const directory = app.languageFilesPath(locale);
  const files = await readdir(directory);

  const keys = await Promise.all(
    files.map(async (file) => {
      // SAFETY: translation files hold nested objects of strings, as the i18n loader requires.
      const translations = JSON.parse(
        await readFile(`${directory}/${file}`, 'utf8')
      ) as Translations;

      return flatten(translations, `${file.replace(/\.json$/, '')}.`);
    })
  );

  return keys.flat().toSorted();
}

test.group('Core | translations', () => {
  test('pt-BR translates exactly the keys en-US defines', async ({
    assert,
  }) => {
    assert.deepEqual(await keysOf('pt-BR'), await keysOf('en-US'));
  });
});
