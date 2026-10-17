# Frontend architecture

`apps/frontend/src/features/` holds one folder per **feature**, named after the backend module whose API it calls. `src/routes/` holds the TanStack Router file routes. They are wiring, like the backend's `start/`: guards, loaders, and the page component a path renders.

| Feature   | Owns                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `core`    | The API client, the query client, the session store, the form kit, error messages, shared components. |
| `users`   | The profile query, the avatar, the account menu, the profile page.                                    |
| `auth`    | The login and sign-up pages.                                                                          |
| `tenancy` | The tenant list, the chosen workspace, the switcher, onboarding.                                      |
| `access`  | Permissions, the workspace pages (overview, members, invitations, roles), accepting an invitation.    |
| `audit`   | The event timeline and its texts, the audit trail page, a record's history, the account activity.     |

A page that shows another feature's section composes it in its route: `routes/_app/profile.tsx` renders `ProfilePage` from `users` with `AccountActivity` from `audit` as its children, since `users` can't import `audit`.

## Dependencies between features

`apps/frontend/features.json` lists, per feature, the other features it may import. The lint enforces it, the same way `apps/backend/modules.json` constrains backend modules. A feature imports another only through `@/features/<feature>/...`, never through a relative path. Routes may import any feature. A new feature or a new dependency goes in `features.json` in the same change.

## Translations

Every string a person reads, labels and placeholders included, lives in `src/locales/<locale>/<namespace>.json` (en-US and pt-BR) and renders through `t('<namespace>.<component>.<message>')` from `@/features/core/i18n`. The namespace is the feature (`routes` for route files); a new namespace file is added to both locales' `index.ts`. Messages use the ICU syntax the backend uses: values as `{name}` (`t('access.rolesPage.deleted', { name })`), apostrophes as `’`.

- A key missing from en-US fails the typecheck at the `t()` call; pt-BR with a missing or extra key fails it in `core/i18n.ts`, naming the keys.
- Dates and numbers format with `Intl` and the exported `locale`.
- The lint rule `i18n/no-untranslated-text` rejects text written straight into JSX, text props, and `toast()` calls.

The locale is resolved once per page load from the system languages (`navigator.languages`): the first one whose primary subtag a supported locale shares, else en-US. Every API request sends it as `Accept-Language`, so error and validation messages arrive already translated: show them as they come, never re-translate them by code.

## Server state

API reads and writes go through TanStack Query, with `queries` from `@/features/core/api` (`@tuyau/react-query`). Logout is the exception: it calls `api` directly, since no screen shows what it changes.

- **Reads**: a feature exports a query factory per endpoint (`membersQuery(tenantId)`), used by both the route loader and the component, so they share one cache entry.
- **Workspace requests** pass `tenantHeaders(tenantId)`. Tuyau keys a query by its whole request, header included, so each workspace caches apart.
- **Loaders and guards** load with `queryClient.query(options)`. It answers from the cache while the data is fresh, and fetches when a write has marked it stale, so a guard never decides on outdated data. `ensureQueryData`, `fetchQuery` and `prefetchQuery` are deprecated.
- **Writes** use `useMutation(queries.x.y.mutationOptions())`. Every successful write invalidates every query (`core/query-client.ts`), and the mutation stays pending until the screens on display have refetched. A 401 anywhere signs the session out. A 403 `E_TENANT_SUSPENDED` anywhere reruns the route guards (`router.tsx`) on a fresh tenant list, and the workspace guard sends the member to `/workspace-suspended`.

## Redirects

Redirect only from `beforeLoad`. The router renders a route's cached match while its loader reloads in the background, so a redirect thrown from a loader shows the old page first.

## Forms

Build forms with `useAppForm` from `@/features/core/form`, which provides `form.Form`, `form.FormAlert`, `form.SubmitButton` and the `field.TextField` field component. In `onSubmit`, wrap the write in `withFormErrors(formApi, mutation.mutateAsync(...))`: a 422 shows on its fields, any other failure in the form's alert, and it resolves to `null` on failure.

## Client state

Browser-persisted state is a store from `createPersistedStore(name, schema, initial, storage?)` (`core/persisted-store.ts`), in localStorage unless `storage` says otherwise. Never read or write `localStorage` or `sessionStorage` directly.

- What it reads back is parsed with the zod `schema`. Data that is missing or doesn't parse leaves `initial`.
- Blocked storage keeps the store in memory.
- Another tab's localStorage writes apply live.

The session (`core/session.ts`, the access token) is shared by every tab. The workspace choice (`tenancy/workspace.ts`) is per tab, in sessionStorage, so two tabs can show two workspaces. A new tab starts from the workspace last chosen in any tab. `router.tsx` subscribes to the session: a token change clears the query cache and reruns the route guards. Choosing a workspace navigates, which reruns them too.

## The active workspace

The URL never names a workspace. Pages about one live under the `_app/_workspace` layout route. Its `beforeLoad` resolves the active workspace with `resolveTabWorkspace(tenants)`: the tab's choice while the user still belongs to it, otherwise their first. It records the result, so a reload keeps the tab on the same workspace. With no workspace, it redirects to `/onboarding`. A page reads the result with `useActiveTenant()`, and the user's permissions there with `usePermissions()`.
