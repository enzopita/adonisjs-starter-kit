import { z } from 'zod';
import { useStore } from 'zustand';

import { LOCALES } from '@/features/core/locales';
import type { Locale } from '@/features/core/locales';
import { createPersistedStore } from '@/features/core/persisted-store';

/**
 * The language and time zone the account is known to use, mirrored from the profile. A reload
 * before the profile loads already renders in the right language and zone.
 */
const preferencesStore = createPersistedStore(
  'starter:preferences',
  z.object({
    locale: z.enum(LOCALES).nullable(),
    timeZone: z.string().min(1).nullable(),
  }),
  { locale: null, timeZone: null }
);

export const preferences = {
  persists: preferencesStore.persists,
  locale: () => preferencesStore.getState().locale,
  timeZone: () => preferencesStore.getState().timeZone,
  set: (next: { locale?: Locale; timeZone?: string }) =>
    preferencesStore.setState((current) => ({ ...current, ...next })),
  /**
   * Drops the stored time zone, kept distinct from `locale`: the login page still shows the
   * browser's last UI language after sign-out, but a stale zone from the signed-out account must
   * never carry into whoever signs in next.
   */
  clearTimeZone: () =>
    preferencesStore.setState((current) => ({ ...current, timeZone: null })),
};

/** The active time zone, re-rendering a component when it changes. `undefined` defers to the runtime's own. */
export function useTimeZone(): string | undefined {
  return useStore(preferencesStore, (state) => state.timeZone ?? undefined);
}
