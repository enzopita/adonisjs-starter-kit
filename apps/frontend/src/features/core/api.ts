import { registry } from '@monorepo/backend/registry';
import { createTuyau } from '@tuyau/core/client';
import { createTuyauReactQueryClient } from '@tuyau/react-query';

import { locale } from '@/features/core/i18n';
import { session } from '@/features/core/session';

const client = createTuyau({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  registry,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = session.token();

        request.headers.set('Accept-Language', locale);

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});

export const { api } = client;

export const queries = createTuyauReactQueryClient({ client });

/** Tuyau keys a query by its whole request, header included, so each workspace caches apart. */
export function tenantHeaders(tenantId: string) {
  return { headers: { 'X-Tenant-Id': tenantId } };
}

/**
 * Revokes this browser's token and signs out. While impersonating, the admin's own token goes too:
 * logging out ends the admin's session, not only the impersonation. The token is dropped even if
 * a call fails, since the user asked to be signed out of this browser.
 */
export async function logOut() {
  await api.profile.accessTokens.destroy({}).safe();

  if (session.isImpersonating()) {
    session.stopImpersonating();
    await api.profile.accessTokens.destroy({}).safe();
  }

  session.signOut();
}
