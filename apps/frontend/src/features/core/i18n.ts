import { IntlMessageFormat } from 'intl-messageformat';

import { LOCALES } from '@/features/core/locales';
import type { Locale } from '@/features/core/locales';
import { preferences } from '@/features/core/preferences';
import enUS from '@/locales/en-US';
import ptBR from '@/locales/pt-BR';

/**
 * The first preferred language a supported locale shares a primary subtag with (`pt-PT` reads
 * pt-BR), else en-US. The backend resolves Accept-Language the same way.
 */
export function resolveLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const match = LOCALES.find((locale) =>
      locale.startsWith(`${language.split('-')[0]}-`)
    );

    if (match) return match;
  }

  return 'en-US';
}

/**
 * Read once: the preferences store's choice, else the system language. Every module-level `t()`
 * and `Intl` cache assumes this value never changes mid-session, so changing the UI language
 * reloads the page instead of reassigning it.
 */
export const locale =
  preferences.locale() ?? resolveLocale(navigator.languages);

type Catalog = { [key: string]: string | Catalog };

type KeysOf<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${KeysOf<T[K]>}`;
}[keyof T & string];

/** A dotted path to a message in `src/locales/en-US`: `<file>.<component>.<message>`. */
export type MessageKey = KeysOf<typeof enUS>;

/** pt-BR typechecks only with exactly en-US's keys; the error names the ones that differ. */
type SameKeys<Translation> = [
  Exclude<MessageKey, KeysOf<Translation>>,
  Exclude<KeysOf<Translation>, MessageKey>,
] extends [never, never]
  ? Translation
  : {
      missing: Exclude<MessageKey, KeysOf<Translation>>;
      extra: Exclude<KeysOf<Translation>, MessageKey>;
    };

const CATALOGS: Record<Locale, Catalog> = {
  'en-US': enUS,
  'pt-BR': ptBR satisfies SameKeys<typeof ptBR>,
};

function flatten(catalog: Catalog, prefix = ''): [string, string][] {
  return Object.entries(catalog).flatMap(([key, value]) =>
    // oxlint-disable-next-line anti-slop/no-runtime-typeof -- this walks parsed JSON, where a leaf is a string and a branch an object.
    typeof value === 'string'
      ? [[`${prefix}${key}`, value]]
      : flatten(value, `${prefix}${key}.`)
  );
}

const messages = new Map(flatten(CATALOGS[locale]));

const formats = new Map<MessageKey, IntlMessageFormat>();

export function t(
  key: MessageKey,
  values?: Record<string, string | number>
): string {
  let format = formats.get(key);

  if (!format) {
    format = new IntlMessageFormat(messages.get(key) ?? key, locale);
    formats.set(key, format);
  }

  // SAFETY: with only string and number values, IntlMessageFormat returns a single string.
  return format.format(values) as string;
}
