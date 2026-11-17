import type { z } from 'zod';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

/**
 * A store saved under `name` in localStorage, or in `storage`. What it reads back is parsed with
 * `schema`, since an older build, another tab or the user may have written it: anything missing or
 * not parsing leaves `initial`. Blocked storage keeps the store in memory, with `persists` false,
 * and another tab's localStorage writes apply here live.
 */
export function createPersistedStore<State extends object>(
  name: string,
  schema: z.ZodType<State>,
  initial: State,
  storage: () => Storage = () => localStorage
) {
  const store = createStore<State>()(
    persist(() => initial, {
      name,
      version: 1,
      storage: createJSONStorage(storage),
      merge: (persisted) => schema.safeParse(persisted).data ?? initial,
    })
  );

  // zustand leaves out `persist` when the storage getter throws, though its type always declares it.
  const persists = 'persist' in store;

  window.addEventListener('storage', (event) => {
    // A null key is localStorage.clear(), from another tab or the devtools.
    if (persists && (event.key === name || event.key === null))
      void store.persist.rehydrate();
  });

  return Object.assign(store, { persists });
}
