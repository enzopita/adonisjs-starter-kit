export const LOCALES = ['en-US', 'pt-BR'] as const;

export type Locale = (typeof LOCALES)[number];

/** Each locale's own name for itself, as its language switcher shows it. */
export const LOCALE_LABELS: Record<Locale, string> = {
  'en-US': 'English (US)',
  'pt-BR': 'Português (Brasil)',
};
