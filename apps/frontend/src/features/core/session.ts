import { z } from 'zod'
import { useStore } from 'zustand'
import { createPersistedStore } from '@/features/core/persisted-store'

export const sessionStore = createPersistedStore(
  'starter:session',
  z.object({
    token: z.string().min(1).nullable(),
    /** Set while a platform admin acts as someone else: the admin's own token, to come back to. */
    impersonation: z
      .object({ adminToken: z.string().min(1) })
      .nullable()
      // State saved before impersonation existed holds `{ token }` alone; it stays signed in.
      .default(null),
  }),
  { token: null, impersonation: null },
)

export const session = {
  token: () => sessionStore.getState().token,
  isAuthenticated: () => sessionStore.getState().token !== null,
  isImpersonating: () => sessionStore.getState().impersonation !== null,
  signIn: (token: string) => sessionStore.setState({ token, impersonation: null }),
  signOut: () => sessionStore.setState({ token: null, impersonation: null }),
  impersonate: (token: string) => {
    const adminToken = sessionStore.getState().token

    if (adminToken) sessionStore.setState({ token, impersonation: { adminToken } })
  },
  /** Back to the admin's own token; outside an impersonation, signs out. */
  stopImpersonating: () => {
    const { impersonation } = sessionStore.getState()

    sessionStore.setState({ token: impersonation?.adminToken ?? null, impersonation: null })
  },
}

export function useIsAuthenticated() {
  return useStore(sessionStore, state => state.token !== null)
}

export function useIsImpersonating() {
  return useStore(sessionStore, state => state.impersonation !== null)
}
