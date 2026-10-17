import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { TuyauError } from '@tuyau/core/client'
import { session } from '@/features/core/session'

/**
 * A token the API no longer accepts (expired, revoked elsewhere) is a signed-out session. An
 * expired impersonation returns the admin to their own session instead.
 */
function signOutOnUnauthorized(error: Error) {
  if (error instanceof TuyauError && error.status === 401) session.stopImpersonating()
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: signOutOnUnauthorized }),
  mutationCache: new MutationCache({
    onError: signOutOnUnauthorized,
    // Any write can change what a screen shows, your own permissions included; the mutation
    // stays pending until the screens on display have refetched.
    onSuccess: () => queryClient.invalidateQueries(),
  }),
  defaultOptions: {
    queries: { staleTime: 30_000, retry: false },
  },
})
