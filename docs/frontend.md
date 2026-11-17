# Frontend architecture

`apps/frontend/src/features/` = one folder per **feature**, named after the backend module it calls. `src/routes/` = TanStack Router file routes: wiring (guards, loaders, the page a path renders).

| Feature   | Owns                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| `core`    | API client, query client, session store, form kit, error messages, shared components. |
| `users`   | Profile query, avatar, account menu, profile page.                                    |
| `auth`    | Login, sign-up, forgot/reset password, verify email.                                  |
| `tenancy` | Tenant list, chosen workspace, switcher, onboarding.                                  |
| `access`  | Permissions, workspace pages (overview, members, invitations, roles), invite accept.  |
| `audit`   | Event timeline and texts, audit trail, record history, account activity.              |
| `admin`   | Platform admin area, impersonation and its banner, the menu's admin item.             |

Cross-feature pages compose in the route: `routes/_app/profile.tsx` renders `ProfilePage` (`users`) with `AccountActivity` (`audit`) as children, since `users` can't import `audit`.

## Dependencies between features

`apps/frontend/features.json` lists what each feature may import, enforced by lint. Import via `@/features/<feature>/...`, never relative. Routes may import any feature. New feature or dependency: update `features.json` in the same change.

## Translations

Every visible string (labels, placeholders) lives in `src/locales/<locale>/<namespace>.json` (en-US, pt-BR), rendered with `t('<namespace>.<component>.<message>')` from `@/features/core/i18n`. Namespace = feature (`routes` for routes); register new files in both locales' `index.ts`. ICU like the backend: `{name}`, apostrophe `’`.

- Missing en-US key fails typecheck at `t()`; pt-BR drift fails in `core/i18n.ts`.
- Lint `i18n/no-untranslated-text` rejects raw text in JSX, text props, `toast()`.
- Locale resolved **once per page load**: preferences store (`core/preferences.ts`), else `navigator.languages`, else en-US. Sent as `Accept-Language`: show API messages as they arrive, never re-translate.
- Module-level `t()` and `Intl` caches assume a fixed locale, so changing language reloads the page.
- `routes/_app.tsx` mirrors the profile's `locale`/`timezone` into the store; fills missing ones from the browser.

## Dates and time zones

Format through `core/datetime.ts` only (never bare `Intl.DateTimeFormat`/`toLocaleString`): `formatDate(value, preset, timeZone)` with `DATE_LONG`, `DATE_MEDIUM`, `DATE_TIME_SHORT`, `DATE_TIME_MEDIUM`, and `useTimeZone()` for the zone (re-renders on change). `relativeTime` is zone-agnostic. `TIME_ZONES` feeds the preferences select.

## Server state

TanStack Query with `queries` from `@/features/core/api` (`@tuyau/react-query`). Exception: logout (`logOut` in `core/api.ts`) and stopping impersonation call `api` directly.

- **Reads**: one query factory per endpoint (`membersQuery(tenantId)`), shared by loader and component (one cache entry).
- **Workspace requests**: `tenantHeaders(tenantId)`; the header is part of the cache key.
- **Loaders and guards**: `queryClient.query(options)` (fresh cache or refetch when stale). `ensureQueryData`, `fetchQuery`, `prefetchQuery` are deprecated.
- **Writes**: `useMutation(queries.x.y.mutationOptions())`. Success invalidates every query (`core/query-client.ts`); the mutation stays pending until visible screens refetch.
- **Global**: 401 signs out; 403 `E_TENANT_SUSPENDED` reruns guards (`router.tsx`) and sends to `/workspace-suspended`.

## Redirects

Only from `beforeLoad`: a loader redirect shows the cached old page first.

## Forms

`useAppForm` from `@/features/core/form` (`form.Form`, `form.FormAlert`, `form.SubmitButton`, `field.TextField`). In `onSubmit`: `withFormErrors(formApi, mutation.mutateAsync(...))`: 422 → fields, else form alert; resolves `null` on failure.

## Client state

Persisted state = `createPersistedStore(name, schema, initial, storage?)` (`core/persisted-store.ts`), localStorage by default. Never touch `localStorage`/`sessionStorage` directly.

- Read-back parsed with the zod `schema`; invalid or missing → `initial`.
- Blocked storage → in memory, `persists` false.
- Other tabs' localStorage writes apply live.

Session (`core/session.ts`) is shared by all tabs; a token change clears the query cache and reruns guards (`router.tsx`). Workspace choice (`tenancy/workspace.ts`) is per tab (sessionStorage); a new tab starts from the last one chosen anywhere.

## The active workspace

The URL never names a workspace. Workspace pages live under `_app/_workspace`, whose `beforeLoad` runs `resolveTabWorkspace(tenants)` (tab's choice if still a member, else first), records it, and redirects to `/onboarding` when none. Read with `useActiveTenant()`; permissions with `usePermissions()`.
