# Frontend architecture

`apps/frontend/src/features/` = one folder per **feature**, named after the backend module it calls. `src/routes/` is wiring: guards, loaders, the page a path renders.

## Dependencies between features

`apps/frontend/features.json` lists what each feature may import (lint-enforced). Routes may import any feature, so a page mixing features composes them in its route: `routes/_app/profile.tsx` renders `ProfilePage` (`users`) with cards from `auth` and `audit` as children.

## Translations

Every visible string lives in `src/locales/<locale>/<namespace>.json` (en-US, pt-BR), rendered with `t('<namespace>.<component>.<message>')` from `@/features/core/i18n`. Namespace = feature (`routes` for routes); register new files in both locales' `index.ts`. ICU like the backend: `{name}`, apostrophe `’`.

- API messages arrive translated (`Accept-Language`): show them as they come, never re-translate.
- Locale is fixed per page load (module-level `t()` and `Intl` caches), so changing language reloads the page.

## Dates and time zones

Format only through `core/datetime.ts` (`formatDate` + `useTimeZone()`), never bare `Intl.DateTimeFormat`/`toLocaleString`. `relativeTime` is zone-agnostic.

## Server state

TanStack Query with `queries` from `@/features/core/api` (`@tuyau/react-query`). Exception: logout (`logOut` in `core/api.ts`) and stopping impersonation call `api` directly.

- **Reads**: one query factory per endpoint (`membersQuery(tenantId)`), shared by loader and component (one cache entry).
- **Workspace requests**: `tenantHeaders(tenantId)`; the header is part of the cache key.
- **Loaders and guards**: `queryClient.query(options)`, never the deprecated `ensureQueryData`, `fetchQuery`, `prefetchQuery`.
- **Writes**: `useMutation(queries.x.y.mutationOptions())`. Success invalidates every query (`core/query-client.ts`); the mutation stays pending until visible screens refetch.
- **Global errors**: 401 drops the token (an impersonation returns to the admin's). 403 `E_TENANT_SUSPENDED` or `E_TWO_FACTOR_REQUIRED` reruns the stale guard (`router.tsx`).

## Redirects

Only from `beforeLoad`: a loader redirect shows the cached old page first.

## Forms

`useAppForm` from `@/features/core/form`. In `onSubmit`, wrap the write in `withFormErrors(formApi, mutation.mutateAsync(...))`.

## Client state

Persisted state = `createPersistedStore(...)` (`core/persisted-store.ts`); never touch `localStorage`/`sessionStorage` directly.

Session (`core/session.ts`) is shared by all tabs; a token change clears the query cache and reruns guards. Workspace choice (`tenancy/workspace.ts`) is per tab (sessionStorage), so two tabs can show two workspaces.

## The active workspace

The URL never names a workspace. Workspace pages live under `_app/_workspace`, whose `beforeLoad` resolves it (`resolveTabWorkspace`) and redirects to `/onboarding` or `/workspace-suspended`. Read it with `useActiveTenant()`, permissions with `usePermissions()`.
