import app from '@adonisjs/core/services/app';
import { defineConfig, formatters, loaders } from '@adonisjs/i18n';

/** The one list of locales the app supports; validators import this instead of repeating it. */
export const supportedLocales = ['en-US', 'pt-BR'] as const;

const i18nConfig = defineConfig({
  defaultLocale: 'en-US',
  supportedLocales: [...supportedLocales],
  formatter: formatters.icu(),
  loaders: [loaders.fs({ location: app.languageFilesPath() })],
});

export default i18nConfig;
