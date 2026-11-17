# Backend architecture

`apps/backend/app/` = one folder per **module**: a bounded context owning its vocabulary, tables and routes (not 1:1 with tables). `start/`, `config/`, `database/`, `providers/`, `commands/`, `tests/` are wiring, not modules.

| Module | Owns |
| --- | --- |
| `core` | Exception handler, global middleware, `apiRoutes`, health checks, audit recorder. |
| `users` | `User` identity: model, transformer, access tokens, profile, locale, timezone. |
| `auth` | Sign-up, login, two-factor, sessions, password reset, email verification, `auth` mw. |
| `attachments` | Uploads, signed URLs, the claim service, pruning. |
| `tenancy` | Tenants, memberships, tenant scope on models, `tenant` mw. |
| `access` | Roles, grants, invitations, platform admins, the `can` Bouncer ability. |
| `audit` | Reading and pruning the trail; which permission opens which history. |
| `admin` | Platform admin area: tenants, users, suspend, disable, impersonate. |

## Starting a new module or feature

Extending an existing context: skip step 1. Run from `apps/backend/`.

1. **Module**: `node ace make:module <name> [--events]`. Never create `app/<name>/` by hand: the command also registers the `adonisrc.ts` preloads, and a missing preload fails silently.
2. **Dependencies**: a new module imports only `core`; add others to `modules.json` (see [Dependencies between modules](#dependencies-between-modules)).
3. **Tables**: `node ace make:model <module>/<name> -m -f --transformer`, fill the migration, `node ace migration:run`. It regenerates `database/schema.ts` (`<Name>Schema`), so the model typechecks only after it.
4. **Input**: `node ace make:validator <module>/<entity>`.
5. **Behavior**: an action per write, a query per non-trivial read ([Code conventions](#code-conventions)). No generator: copy the closest one.
6. **HTTP**: `node ace make:controller <module>/<name>` ([Controllers](#controllers-and-the-typed-client)); routes in `app/<module>/routes.ts` inside `apiRoutes()`.
7. **Tests**: `node ace make:test <module>/<name> --suite=functional|unit`, per `docs/testing.md`.
8. **Codegen**: the frontend sees new routes and types after `node ace codegen` (root `pnpm dev` runs it on change).

Migrations all live in `database/migrations/`: Lucid runs folders in config order, not by timestamp, so per-module folders would break cross-module foreign keys.

### Module layout

```
app/<module>/
  routes.ts           # preloaded; mounts under /api/v1 via apiRoutes() from #core/api_routes
  controllers/        # thin: validate → action or query → serialize
  actions/            # one write use case per file
  queries/            # one read use case per file
  services/           # behavior with side effects shared by several actions
  jobs/               # background work run by the queue worker
  mails/              # one class per mail
  database/factories/
  types/events.ts     # EventsList declaration merge, when the module emits events
  types/audit.ts      # AuditEvents declaration merge, when the module records audit events
  start/events.ts     # its listeners, preloaded
  tests/{unit,functional}/
```

### Generators

`make:*` reads `apps/backend/stubs/`; name is `<module>/<name>` and the module must exist. `make:migration` takes a bare table name.

- Pass every flag a command would prompt for (`--suite`): a prompt hangs non-interactive runs.
- `make:model`: spell out `--transformer` (`-c` is also `--controller`).
- `make:exception` emits a plain `Exception`: rewrite it as an `ApiException` ([Errors](#errors)).
- Middleware: no generator (`make:middleware` breaks `start/kernel.ts`). Create in `app/<module>/middleware/`, register in `start/kernel.ts` by hand.

## Controllers and the typed client

Tuyau infers frontend types from controllers. Every action:

- **`request.validateUsing(validator)`**, or the body is `any` on the frontend.
- **Returns `serialize(...)`**: models through a transformer (`UserTransformer.transform(user)`, `.paginate(rows, meta)`), else a plain object (`serialize({ message })`). A raw model types as empty `ModelObject`; a bare object skips the `{ data }` envelope (`providers/api_provider.ts`).

Expected failures are exceptions ([Errors](#errors)); the frontend narrows with `error.isStatus(404)` or `code`.

**OpenAPI** (`@enzopita/adonisjs-openapi`, `config/openapi.ts`, `strict: true`): `GET /docs` outside production; `openapi.json` is committed. Doc comment per action, en-US:

- **Summary**: first paragraph, imperative, ≤60 chars, no period (`Create a role`).
- **Description**: only what the schema can't say: required permission, side effects (mail, signed-out sessions), non-obvious behavior. Maintainer reasoning → `//` inside the method.
- **`@tags`**: one tag from `config/openapi.ts`; on the class when shared.

After changing a route, action, validator or exception: `node ace openapi:generate`, commit `openapi.json`. `node ace openapi:check --strict` (functional test + `pre-push`) fails on a stale file or any diagnostic. `openapi:generate --explain=<route name>` shows where each response comes from.

## Errors

Body: `{ code, message }`; validation `422`: `{ errors: [{ field, message, rule }] }`. `code` is stable (frontend branches on it), `message` is translated.

- **Expected failure = `ApiException` subclass**: one file in the owning module's `exceptions/`, extends `ApiException<'E_CODE'>` (`#core/exceptions/api_exception`), with `static status`, `code`, `message` (English fallback). Add `errors.<code>` to every `resources/lang/*/errors.json`. Throw from an action or middleware; never a response helper.
- **Everything else**: `app/core/exceptions/handler.ts` owns the shape. In production a `5xx` sends `E_INTERNAL_SERVER_ERROR` + a generic message, so SQL/driver text never leaks; dev and tests keep the stack.

OpenAPI **derives** error responses from: `throw new` in the action, its actions/services, or route middleware; middleware response helpers; `401` of `auth` routes; `422` of `validateUsing`; AdonisJS package throws (`authorize()` 403, `findOrFail()`/`firstOrFail()` 404, `verifyCredentials()` 400, limiter 429). Other packages' throws → an `errors` entry in `config/openapi.ts`.

- **Describe once, on the class**: first paragraph of the exception's doc comment (`/** The role is still assigned to a member */`).
- **`@response` on the action only for a reason it owns**: `` @response {403} Lacks `members.manage` ``, `@response {404} Role not found`, `@response {429} Reason`. Only for a derived status (else `OA-T003`). Underived status: `@response {413} {EntityTooLarge} Reason`. Thrown from code the generator doesn't follow: `@throws {LastManagerException}`.

## Attachments

Two requests: upload to `POST /api/v1/attachments`, send the returned `id` with the record's write. Reference: `users.avatar_attachment_id`.

1. Single-column FK named `*_attachment_id`, `references('id').inTable('attachments')`, default `ON DELETE`. A schema test fails on a cascading or missing FK for that name; prune throws on a multi-column FK.
2. Narrow types in the consumer: upload accepts all of `#attachments/rules`.
3. Claim **in the write's transaction**: `new ClaimAttachments().handle(trx, { ids, uploaderId, rule })`, rule from `defineAttachmentRule({ extnames, maxSize })`, only newly added ids.
4. Embed via `AttachmentTransformer` (one-hour signed URL).
5. Remove a file by dropping the reference, never deleting it: `PruneAttachmentsJob` deletes unreferenced attachments older than a day.

## Queues

`@adonisjs/queue` on Redis.

- **Dispatch after commit**: inside a transaction the job may run before commit or after rollback.
- **Payload = ids**, not models (JSON).
- **Idempotent**: retries and stalled recovery re-run partial jobs.
- **Recurring**: `start/scheduler.ts`, upserted by job class name. Reference: `PruneAttachmentsJob`.
- **Worker**: only the root `pnpm dev` starts it (and runs `queue:migrate`); `apps/backend`'s `pnpm dev` is the server alone.
- **Tests**: `QUEUE_DRIVER=sync`. Assert dispatch with `QueueManager.fake()`, restore in teardown.

## Rate limiting

Throttles live in `start/limiter.ts`, off in development. A route that must penalize only failures (login, two-factor) calls `penalizeLoginFailure`/`penalizeTwoFactorFailure` instead of the HTTP middleware.

## Two-factor authentication

TOTP, optional for users, required for platform admins. Owned by `auth`.

- **Single use**: `users.two_factor_last_step` + a conditional update, so a code works once even under concurrency.
- **Recovery codes**: `encryption.blindIndex()` HMACs, not brute-forceable from a dump. Rotating `APP_KEY` invalidates every secret and code.
- **Login with two-factor** opens no session: answers `{ twoFactorRequired: true, challenge }` (user id encrypted with `APP_KEY`, 5 min); `POST /api/v1/auth/login/two-factor` finishes it.
- **Every live session passed a second factor**: confirming revokes other sessions; login re-reads the user after creating its token and drops it if two-factor got confirmed meanwhile. So admin checks only read `two_factor_confirmed_at`.
- **Impersonation never changes sign-in**: two-factor writes answer 403 `E_IMPERSONATING`.
- **One off-switch**: `clearTwoFactor` (`auth/services/two_factor.ts`), shared by disable and the admin reset.
- **No event holds a secret, code or challenge.**
- **Sessions** slide: 30 idle days (`SESSION_IDLE_TIMEOUT_DAYS`), extended on each request. Impersonation tokens keep a 1-hour cap.

### Lost device

An admin resets it (`DELETE /api/v1/admin/users/:id/two-factor`): clears secret and codes, deletes the user's own sessions (impersonation ones are the admin's), and **holds sign-in until a new password** via a mailed link. Why: the admin can't verify who asked, so a phished password alone must not be enough; the inbox proves ownership.

- Hold = `users.password_reset_required_at` + a `password_reset` user token; the link is the normal `/reset-password/:token`.
- While held, a correct password answers 403 `E_PASSWORD_RESET_REQUIRED` (after the disabled check), no session; `openSession` re-reads it like `disabled_at`.
- `ResetPassword` clears the hold. Two-factor stays off until the user re-enables it.
- API refuses platform admins and disabled users; operators use `node ace admin:reset-two-factor <email>`.

## Tenancy

A tenant is a workspace joined via `tenant_memberships`. **Every business table is tenant-scoped**: a new module storing app data depends on `tenancy`. `users`, `auth`, `attachments` sit below it.

Every query of a scoped model needs a context (`#tenancy/tenant_context`):

- `runInTenant(tenantId, fn)`: restricts to that tenant.
- `runAsSystem(fn)`: cross-tenant. Await every query inside: an unexecuted builder runs after the context ends.
- Neither: 500 `E_MISSING_TENANT_CONTEXT`. Missing context is a bug, never "all tenants".

### Make a model tenant-scoped

1. Depend on `tenancy` in `modules.json`.
2. Migration: `table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE').index()`.
3. `class Project extends compose(ProjectSchema, withTenant) {}` (`#tenancy/mixins/with_tenant`).

The mixin filters every model query (reads, `find`, `paginate`, bulk `update()`/`delete()`, `pojo()`, relations and preloads from global models), fills `tenantId` on create (set it yourself in `runAsSystem()`), and throws on saving a row with another `tenantId`.

**Not scoped** (filter `tenant_id` yourself):

- `db` queries and the `exists`/`unique` rules. Use `existsInTenant(Project)` (`#tenancy/validators/exists_in_tenant`).
- `has()`, `whereHas()`, `withCount()` from a global model.
- Instance `save()`/`delete()` (by primary key on an already-scoped row).

### Requests

Tenant routes: `middleware.auth()` then `middleware.tenant()`; client sends `X-Tenant-Id`. Unknown tenant and non-member get the same 403 `E_TENANT_ACCESS_DENIED`, so ids can't be probed.

### Jobs and commands

No request, no context. Tenant jobs carry `tenantId` in the payload and run in `runInTenant(this.payload.tenantId, ...)`; cross-tenant work in `runAsSystem()`.

## Authorization

`access` decides what a member may do: at most one role + any grants, no denials. Roles, assignments, grants are tenant-scoped. Every check: `bouncer.authorize(can, PERMISSIONS.x)` (`#access/abilities`).

- **Permissions**: `PERMISSIONS` in `app/access/permissions.ts`. Removing one is safe: unknown stored permissions grant nothing.
- **Denial** inside a tenant records `access.denied` (the bouncer middleware wraps `authorize()`); `bouncer.allows()` records nothing.
- **Context**: inside `middleware.tenant()` uses that tenant's role and grants; outside (or `runAsSystem()`) only a platform admin with two-factor passes, so forgetting `middleware.tenant()` denies everyone else.
- **Last manager**: a change leaving nobody with `members.manage` answers 409 `E_LAST_MANAGER`.

### Invitations

`POST /api/v1/invitations` upserts on `(tenantId, email)`: re-inviting refreshes and resends. Accept runs outside `tenant` (`runAsSystem` lookup), answers the same 404 `E_INVITATION_NOT_FOUND` for unknown and expired (no probing), and is retry-safe. An invitation's `roleId` blocks role deletion (409 `E_ROLE_IN_USE`).

### Platform admins

A `platform_admins` row **plus confirmed two-factor** passes every check everywhere; without two-factor, treated like anyone. No role or grant can hold `platform.admin`. First admin: `node ace admin:grant <email>` (idempotent).

### Tenant owner

`access` listens to `tenancy:tenant_created`: creates the "Owner" role (every permission but `platform.admin`, named in the creator's locale) and assigns it. Rerunning is safe only in the same locale: the role is matched by its translated name. New catalog permissions don't reach existing Owners: grant via `PUT /api/v1/roles/:id` or a data migration recording `role.updated` per role (reference: `…_grant_audit_view_to_owner_roles.ts`).

If the listener throws, the tenant exists without an Owner. Fix from `node ace repl`, with the creator's locale:

```ts
await import('#access/actions/seed_tenant_owner').then(
  ({ default: SeedTenantOwner }) =>
    new SeedTenantOwner().handle({ tenantId, creatorId, locale: 'en-US' })
);
```

## Mail

- Single-link mail: extend `LinkMail` (`core/mails/link_mail.ts`). Reference: `access/mails/invitation_mail.ts`.
- Translate in the class with `i18nManager.locale(locale)` and pass finished strings: views render in the worker from JSON, and Edge's global `t()` only knows the default locale.
- Locale for an existing user: `mailLocaleFor` (`users/services/mail_locale`): user's, else request's, else default. Invitations use the inviter's request locale unless the email has an account.

## Audit trail

Every successful write records one **audit event** (`audit_events`): business intent (`member.role_changed`), subject, display values of that moment, actor and session. The app never updates events; retention deletes them.

### Record an event

1. **Declare** in `<module>/types/audit.ts`, merging into `AuditEvents` (`#core/audit/types`): `TenantEvent<'role', { name: string }>` (tenant trail), `AccountEvent<…>` (no tenant), `SystemEvent<…>` (jobs, listed nowhere). Data holds display values (names, emails) so it survives the subject.
2. **Record in the write's transaction**: `await audit.record(trx, 'role.deleted', { tenantId, subject: { type: 'role', id: role.id }, data: { name: role.name } })` (`#core/audit/main`). `audit.note(type, entry)` only when no row shares a transaction (login, logout).
3. **Import** `import type {} from '#<module>/types/audit'` in that file: the frontend sees only imported declarations.

Updates: `dirtyChanges(row, ['name', 'permissions'])` before `save()` → `{ name: { from, to } }`. Keys `password`, `token`, `tokenHash`, `token_hash`, `hash`, `secret` are stored `'[redacted]'` at any depth.

Origin (actor, session, impersonator, request id, IP, UA) comes from `audit_scope_middleware`'s AsyncLocalStorage scope. The user appears mid-request in login (pass `actorId` + `sessionId`) and sign-up (`actorId`). No request (repl, seeds, jobs) = system.

### The guard

A 2xx `POST`/`PUT`/`PATCH`/`DELETE` without an event fails: 500 `E_UNAUDITED_WRITE` outside production, logged error in production. 4xx needs no event. Exemptions (use only these):

- **Route that is no person's action** (webhook keeping its own trail):

  ```ts
  router
    .post('webhooks/provider/:kind', [ProviderWebhooks, 'store'])
    .use(middleware.unaudited({ reason: 'provider_callback' }));
  ```

  Reasons: `UnauditedReason` in `#core/audit/scope`. Add the route to the expected list in `unaudited_routes.spec.ts`; it must not sit behind `auth` or `tenant`.

- **Write that changed nothing**: `audit.unchanged()` in the action.

Exempt + event recorded anyway: 500 `E_AUDIT_EXEMPTION_MISUSED`.

Why not a mixin or trigger: Lucid hooks miss bulk `query().delete()` and record diffs, not intent; a Postgres trigger has no actor or session.

### Read a trail

- `GET /api/v1/audit/events` (`auth`, `tenant`): rows nest `event: { type, subject, data }` because inferred types keep a union only inside a field.
- **Per-record history**: same endpoint filtered by `subjectType` + `subjectId`. Map the subject type to its feature permission in `SUBJECT_PERMISSIONS` (`app/audit/subject_permissions.ts`); otherwise it needs `audit.view`.
- A future job writing on behalf of a request: snapshot the origin into its payload via a new function in `#core/audit/scope`.

## Admin

Routes need `auth`, run outside any tenant, check `bouncer.authorize(can, PERMISSIONS.platformAdmin)`. Every route but `admin/me` goes in the group with the `twoFactor` middleware; both read `platform_admins` directly to tell "must enroll" from "not an admin".

States are nullable timestamps; each invariant is held **at its write**, not checked per request:

- **Suspended tenant** (`tenants.suspended_at`): `tenant` mw answers members 403 `E_TENANT_SUSPENDED`.
- **Disabled user** (`users.disabled_at`) holds no token: disabling deletes tokens in the transaction and again after commit; login re-reads `disabled_at` after creating its token. No row locks needed.
- **Platform admins are protected**: never disabled, impersonated or two-factor-reset via API (409 `E_PLATFORM_ADMIN_PROTECTED`). Why: one stolen admin session must not take over another admin.
- **No self-revoke**: 409 `E_CANNOT_REVOKE_SELF`; `node ace admin:grant` recovers.
- **Two-factor reset** isn't idempotent (409 `E_TWO_FACTOR_NOT_ENABLED` when off): a repeat would sign out and mail again.
- **Idempotent writes** (suspend, disable, grant and reverses): repeat keeps the first date, 200, records the event again.

**Impersonation**: an ordinary one-hour access token with `impersonator_id` (`User.currentAccessToken.impersonatorId`, stored in `audit_events.impersonator_id`). Ends with `POST /api/v1/account/logout`; the frontend restores the admin token. Never reaches the admin area.

## Locale, timezone and UTC

- `users.locale`/`users.timezone` nullable: null = unknown (legacy users); the frontend fills them from the browser.
- One list: `localeRule` and `timezoneRule` in `#users/validators/user.ts`. `timezoneRule` resolves aliases (`Asia/Kolkata`, `Etc/UTC`) to the canonical name, which `Intl.supportedValuesOf` alone misses.
- **UTC everywhere**: `TZ=UTC` (`apps/backend/.env.example`, CI), so Luxon serializes `+00:00`. Only the frontend converts for display.

## Translations

Messages in `resources/lang/<locale>/*.json`, en-US (default) and pt-BR.

- **Exceptions**: `errors.<code>` in every locale; class `message` is the log fallback.
- **Validation**: `validator.json`, one message per rule, label-agnostic.
- **After the request** (mail, listeners, jobs): carry `i18n.locale` in the payload, translate with `i18nManager.locale(locale)`. Reference: `access:member_invited`.
- **ICU** (`{min}`); apostrophe `’` (`'` escapes in ICU); no HTML inside messages.

## Health checks

`GET /health/live` checks no dependency, so a DB outage never causes a restart loop. `GET /health/ready` runs `start/health.ts`; a new hard dependency gets a check there (custom ones extend `BaseCheck` in `app/core/health_checks/`).

## Dependencies between modules

`apps/backend/modules.json` lists what each module may import, lint-enforced. A new dependency is a reviewed decision, same change, never closing a cycle. `core` depends on nothing.

## Naming feeds the generated registries

`indexEntities` (`adonisrc.ts`) indexes `app/**/*_controller.ts` into `#generated/controllers` (`controllers.auth.AccessTokens`) and `app/**/*_transformer.ts` into the frontend's `Data` (`Data.Users.User`). Other suffixes are silently skipped.

## Code conventions

- **Actions** (`actions/<verb>_<noun>.ts`): default-exported class, one `async handle(input)` (`handle(trx, input)` when it joins the caller's transaction); `input` a plain interface, never `HttpContext`. Returns the primary value, throws module exceptions. Never calls another action: shared work → service or query.
- **Queries** (`queries/<verb>_<subject>.ts`): same shape, read-only, one per business concept.
- **Side effects via events**: mail, notifications, external HTTP, cross-module reactions → `<module>:<past_tense_verb>` events, handled in `<module>/start/events.ts`, emitted after commit.
- **Read-then-write races** (next position, sequence): `forUpdate()` on the parent row in a transaction + a `unique` constraint.
- **Transformers**: `toObject()` base; screen variants `for<Screen>` (`forAccount`).
- **Validators**: `validators/<entity>.ts`, one validator per use case.
