import i18nManager from '@adonisjs/i18n/services/main';

import type User from '#users/models/user';

/**
 * The locale to mail a user in: their own stored preference, else the locale of the request
 * that triggered the mail, else the app default. Centralizes the fallback so every mail (and the
 * admin's two-factor reset, which has no request locale of the user's) applies it the same way.
 */
export function mailLocaleFor(
  user: Pick<User, 'locale'> | null,
  requestLocale?: string
): string {
  return user?.locale ?? requestLocale ?? i18nManager.defaultLocale;
}
