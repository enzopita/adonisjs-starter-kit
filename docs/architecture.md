# Backend architecture

`apps/backend/app/` holds one folder per **module**: a bounded context that owns its vocabulary, its tables, and its routes. A module may hold several models; modules are not 1:1 with tables. Code outside `app/` (`start/`, `config/`, `database/`, `providers/`, `tests/`) is application wiring, not a module.

| Module        | Owns                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `core`        | Infrastructure every module builds on: exception handler, global middleware, `apiRoutes`, health checks, the audit recorder. |
| `users`       | The `User` identity: model, transformer, access tokens, the profile endpoint.                                                |
| `auth`        | Behavior over that identity: sign-up, login, logout, the auth middleware.                                                    |
| `attachments` | Stored files: upload, signed URLs, the claim service consumers call, pruning.                                                |
| `tenancy`     | Tenants and their members, the tenant scope on models, the `tenant` middleware.                                              |
| `access`      | Roles and grants per tenant, platform admins, and the Bouncer ability every check goes through.                              |
| `audit`       | Reading the audit trail: the tenant's events endpoint and which permission opens which subject's history.                    |

## Starting a new module or feature

A feature that extends an existing context goes in that module; skip step 1. All commands run from `apps/backend/`.

1. **Create the module**: `node ace make:module <name> [--events]`. Never create `app/<name>/` by hand: the command also registers the three places nothing warns about when one is missing (the `#<name>/*` alias in `package.json`, the `adonisrc.ts` preloads, `modules.json`). `--events` adds `types/events.ts` and a preloaded `start/events.ts`.
2. **Declare dependencies**: the new module may import only `core`. If it needs another module, add it to its list in `modules.json` (see [Dependencies between modules](#dependencies-between-modules)).
3. **Tables**: `node ace make:model <module>/<name> -m -f --transformer` creates the model, its factory and transformer in the module, and the migration in `database/migrations/`. Fill the migration, then `node ace migration:run`: it regenerates `database/schema.ts`, the `<Name>Schema` class the model extends, so the model doesn't typecheck before this step.
4. **Input**: `node ace make:validator <module>/<entity>`. One file per entity, one validator per use case.
5. **Behavior**: an action in `actions/` for each write, a query in `queries/` for each non-trivial read (see [Code conventions](#code-conventions)). No generator: copy the closest existing one.
6. **HTTP**: `node ace make:controller <module>/<name>`, following [Controllers and the typed client](#controllers-and-the-typed-client), and its routes in `app/<module>/routes.ts`, inside `apiRoutes()`.
7. **Tests**: `node ace make:test <module>/<name> --suite=functional` (or `unit`), only for the behaviors `docs/testing.md` assigns to that layer.
8. **Check**: `pnpm typecheck && pnpm lint` from the root. The frontend sees the new routes and response types after codegen, which `pnpm dev` runs on every change, or `node ace codegen` once.

Migrations are the one thing a module doesn't hold: they all live in `database/migrations/`, next to `database/schema.ts`. Lucid runs migration folders one after another in config order, not by timestamp, so per-module folders would let one module's foreign keys run before the tables they reference.

### Module layout

Create only the folders a module needs; `routes.ts` is the one every module has.

```
app/<module>/
  routes.ts           # preloaded; mounts under /api/v1 via apiRoutes() from #core/api_routes
  controllers/        # thin: validate → action or query → serialize
  actions/            # one write use case per file
  queries/            # one read use case per file
  services/           # behavior with side effects shared by several actions
  jobs/               # background work run by the queue worker
  mails/              # BaseMail subclasses, one per mail
  models/, transformers/, validators/, middleware/, exceptions/, enums/
  database/factories/
  types/events.ts     # EventsList declaration merge, when the module emits events
  types/audit.ts      # AuditEvents declaration merge, when the module records audit events
  start/events.ts     # its listeners, preloaded
  tests/{unit,functional}/
```

### Generators

The `make:*` commands read the ejected stubs in `apps/backend/stubs/`: the name is `<module>/<name>`, and a name without an existing module fails. `make:migration` takes a bare table name and always writes to `database/migrations/`.

```sh
node ace make:controller users/tokens --api             # app/users/controllers/tokens_controller.ts
node ace make:model users/invoice -m -f --transformer   # + database/migrations/…_create_invoices_table.ts
node ace make:validator users/invoice --resource
node ace make:transformer users/invoice
node ace make:exception users/invoice_locked
node ace make:service users/invoice_numbering
node ace make:job users/send_invoice                    # app/users/jobs/send_invoice.ts
node ace make:test users/invoices --suite=functional    # --suite is required
```

- Pass every flag a command would otherwise prompt for (`--suite`): a prompt hangs a non-interactive run.
- On `make:model`, spell out `--transformer`: Lucid gives it the same `-c` alias as `--controller`.
- No generator for middleware: `make:middleware` writes a broken import into `start/kernel.ts`. Create the file in `app/<module>/middleware/` and register it in `start/kernel.ts` by hand.

## Controllers and the typed client

The frontend calls the API through Tuyau, whose types are inferred from the controllers: the request body from the validator, the response from the action's return type. Every controller action follows two rules:

- **Validate with `request.validateUsing(validator)`.** Without it, the request body is typed `any` on the frontend.
- **Return `serialize(...)`.** A model through its transformer (`serialize(UserTransformer.transform(user))`, `serialize(UserTransformer.paginate(rows, meta))` for a paginated list), anything else as a plain object (`serialize({ message })`). Never return a model or a bare object: a model reaches the frontend as `ModelObject` with no fields, and a bare object skips the `{ data }` envelope that `providers/api_provider.ts` gives every response.

Expected failures return through the response helpers (`return response.notFound({ message, key })`): the frontend can narrow them with `error.isStatus(404)`.

## Attachments

A file reaches a record in two requests: the frontend uploads it to `POST /api/v1/attachments`, then sends the returned `id` with the record's write. `users.avatar_attachment_id` is the reference example. A module that stores files:

1. **Depends on `attachments`** in `modules.json`.
2. **References it with a foreign key column named `*_attachment_id`** (or a join table with one), `references('id').inTable('attachments')`, with the default `ON DELETE`. A test fails on any `*_attachment_id` column without that FK, or with a cascading one.
3. **Lets the frontend upload first.** The upload endpoint accepts every type in `#attachments/rules`; the consumer narrows it.
4. **Claims in the same transaction as its write**: `new ClaimAttachments().handle(trx, { ids, uploaderId, rule })`, with a rule from `defineAttachmentRule({ extnames, maxSize })` and only the ids the record is newly adding. It throws a 422 `E_INVALID_ATTACHMENT` for an unknown id, another user's upload, or a file outside the rule.
5. **Embeds it through `AttachmentTransformer`**, which signs a one-hour URL. Load the relation first; whoever serializes the record has already authorized it.
6. **Drops the reference to remove a file.** Never delete attachments by hand: the prune deletes every attachment older than a day that no foreign key references, row and object. It runs daily at 03:00 UTC from `start/scheduler.ts` (`PruneAttachmentsJob`), and on demand with `node ace attachments:prune`; it is safe to run concurrently or after a crash.

## Queues

Background work runs as jobs on `@adonisjs/queue`, backed by Redis through the `main` connection in `config/redis.ts`. A job lives in its module's `jobs/` folder (`node ace make:job <module>/<name>`); the worker discovers every `app/*/jobs/**` file, so a job needs no registration.

- **Dispatch after the transaction commits**: `await SendInvoice.dispatch({ invoiceId })`. A job dispatched inside a transaction can run before the commit, or after a rollback, and miss its row.
- **Payloads carry ids, not models**: the payload is serialized to JSON, and the job loads fresh rows when it runs.
- **Jobs can run twice**: retries (`maxRetries`) and stalled-job recovery re-run a job that may have partly succeeded, so make it idempotent.
- **Recurring jobs** are declared in `start/scheduler.ts`, preloaded only for the HTTP server. A schedule is upserted by its id (the job class name), so every boot of every instance converges on one schedule. `PruneAttachmentsJob` is the reference example.
- **The worker is its own process**: `node ace queue:work`. `pnpm dev` runs it next to the server under `node --watch`; production runs the `worker` service in `compose.dokploy.yaml`.
- **Tests run jobs inline**: `.env.test` sets `QUEUE_DRIVER=sync`. To assert a dispatch without running the job, use `QueueManager.fake()` and restore it in the group's teardown.

## Tenancy

A tenant is a workspace that users join through `tenant_memberships`. The `tenancy` module scopes rows to the current tenant. Every business table belongs to a tenant: a new module that stores app data depends on `tenancy` and makes its models tenant-scoped. `users`, `auth`, and `attachments` sit below it, since a user and their uploads exist before they join any tenant.

Every query of a tenant-scoped model runs inside a context from `#tenancy/tenant_context`:

- **`runInTenant(tenantId, fn)`** restricts the queries in `fn` to that tenant.
- **`runAsSystem(fn)`** lifts the restriction, for work that spans tenants. Await every query inside `fn`: a builder returned unexecuted runs after the context ends.
- **Neither**: the query throws a 500 `E_MISSING_TENANT_CONTEXT`. A missing context is a bug, never "every tenant".

### Make a model tenant-scoped

1. **Depend on `tenancy`** in `modules.json`.
2. **Add the column** in the migration: `table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE').index()`.
3. **Compose the mixin**: `class Project extends compose(ProjectSchema, withTenant) {}`, with `withTenant` from `#tenancy/mixins/with_tenant`. A model without a `tenantId` column doesn't compile.

The mixin adds `<table>.tenant_id = <tenant>` to every query built from the model: reads, `find`, `paginate` and its count, bulk `update()` and `delete()`, `pojo()`, and relationship queries and preloads that reach it from a global model. On create, it fills `tenantId` from the context; in `runAsSystem()`, set it yourself or the create throws. Inside a tenant, saving a row with another `tenantId` throws, so a `tenantId` that slips through `merge()` or `fill()` never moves a row.

The scope doesn't reach:

- **`db` queries and the `exists` and `unique` rules**, which read the table directly. To validate a reference, use `vine.string().uuid().exists(existsInTenant(Project))` from `#tenancy/validators/exists_in_tenant`.
- **`has()`, `whereHas()`, and `withCount()` from a global model**: the subquery counts every tenant. Filter `tenant_id` in the callback.
- **Instance `save()` and `delete()`**, which write by primary key to a row a scoped query already loaded.

A preload with `groupLimit()` on a tenant-scoped model fails with a SQL error.

### Requests

A route that touches tenant data uses `middleware.tenant()` after `middleware.auth()`, and the client sends the tenant id in the `X-Tenant-Id` header:

| Header                                     | Response                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Missing or not a UUID                      | 400, `key: 'E_INVALID_TENANT_HEADER'`                                           |
| Unknown tenant, or the user isn't a member | 403, `key: 'E_TENANT_ACCESS_DENIED'`, the same body for both                    |
| A tenant of the user                       | `ctx.tenant` is the `Tenant`, and the rest of the request runs in `runInTenant` |

`GET /api/v1/tenants` lists the user's tenants. `POST /api/v1/tenants` creates one with the user as its first member, then emits `tenancy:tenant_created` (`{ tenantId, creatorId }`). Both need only `auth`.

### Jobs and commands

A job or command has no request, so it has no context. A job that touches tenant data carries `tenantId` in its payload and runs its work in `runInTenant(this.payload.tenantId, () => ...)`. Work across tenants, such as a scheduled cleanup, runs in `runAsSystem()`.

## Authorization

The `access` module decides what a user may do in a tenant. In each tenant they belong to, a member holds at most one role and any number of individual grants; their permissions there are the role's plus the grants, with no denials. Roles, role assignments and grants are tenant-scoped models, so they follow every rule of [Tenancy](#tenancy). Every check goes through one Bouncer ability, `can` from `#access/abilities`.

### Add a permission

Add it to `PERMISSIONS` in `app/access/permissions.ts`: `invoicesVoid: 'invoices.void'`. Roles and grants accept it from then on.

Removing one is safe: a stored permission the catalog no longer lists grants nothing, and `GET /api/v1/access/me` and the roles endpoints leave it out.

### Check it in a controller

```ts
async destroy({ bouncer, request, serialize }: HttpContext) {
  await bouncer.authorize(can, PERMISSIONS.invoicesVoid)
  // ...
}
```

A denial answers 403 with `{ errors: [{ message }] }`, the `errors.E_AUTHORIZATION_FAILURE` translation.

A check reads the tenant context: inside `middleware.tenant()` it uses that tenant's role and grants. Outside any tenant (no context, or `runAsSystem()`) only a platform admin passes, so a route that forgets `middleware.tenant()` denies everyone else.

The permissions load on the first check of a request and are memoized on the request's `User` instance, so a route that never checks runs no query. A `User` kept beyond its request keeps what it loaded.

### Endpoints

Every route below needs `auth` and `tenant`, and acts in the tenant of `X-Tenant-Id`: its roles and its members, except `POST /api/v1/invitations/accept`, which needs only `auth` since the invited user isn't a member yet.

| Route                                                               | Needs                                       | Does                                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/access/me`                                             | any member                                  | `{ permissions }`: what the user passes, in catalog order, for the frontend to gate its UI.                                                                    |
| `GET /api/v1/access/permissions`                                    | any member                                  | `{ groups }`: the assignable permissions grouped by their `<group>.` prefix, in catalog order, for the frontend to render organized.                           |
| `GET`, `POST /api/v1/roles`; `PUT`, `DELETE /api/v1/roles/:id`      | `roles.manage`, `GET` also `members.manage` | Lists, creates, renames and re-permissions roles. `DELETE` answers 409 `E_ROLE_IN_USE` while someone holds the role, or while a pending invitation carries it. |
| `GET /api/v1/members`                                               | `members.manage`                            | Every member of the tenant, with their role and their individual grants.                                                                                       |
| `PUT /api/v1/members/:userId/role` (`{ roleId }`)                   | `members.manage`                            | Replaces the member's role; `null` removes it.                                                                                                                 |
| `PUT /api/v1/members/:userId/permissions` (`{ permissions }`)       | `members.manage`                            | Replaces the member's grants.                                                                                                                                  |
| `GET`, `POST /api/v1/invitations`; `DELETE /api/v1/invitations/:id` | `members.manage`                            | Lists (pending and expired), sends, and revokes invitations. See "Invitations" below.                                                                          |
| `POST /api/v1/invitations/accept` (`{ token }`)                     | `auth` only                                 | Accepts an invitation by its raw token. See "Invitations" below.                                                                                               |

- A `userId` that isn't a member of the tenant answers 404 `E_MEMBER_NOT_FOUND`, and a `roleId` of another tenant answers 422.
- A change that would leave no one holding `members.manage`, when someone held it, answers 409 `E_LAST_MANAGER`: a member can't demote or strip the last manager, themselves included.

### Invitations

A member holding `members.manage` invites someone by email; the `access` module owns the `invitations` table alongside the role an invitation carries. `POST /api/v1/invitations` (`{ email, roleId }`) upserts on `(tenantId, email)`: inviting an email that's already pending refreshes its token, role, inviter and expiry (7 days) and resends the mail, rather than failing. An email already belonging to a member of the tenant answers 409 `E_ALREADY_MEMBER`. The raw token is only ever in the mailed link (`${FRONTEND_URL}/invitations/:token`); the table stores its SHA-256 hash.

`POST /api/v1/invitations/accept` looks the hash up across every tenant (`runAsSystem`), outside the `tenant` middleware since the invited user isn't a member yet. An unknown or expired token answers 404 `E_INVITATION_NOT_FOUND` (the same body for both, so a token can't be probed to tell a stale one from a wrong one); a signed-in email that doesn't match the invitation's answers 403 `E_INVITATION_EMAIL_MISMATCH`. Otherwise it creates the membership (and the invitation's role, if the user doesn't already hold one) and deletes the invitation, all inside `runInTenant`. Already a member: the invitation is just deleted. Both branches make accept safe to retry with the same token.

An invitation's `roleId` has no `ON DELETE`, like a role assignment's: deleting a role a pending invitation carries answers 409 `E_ROLE_IN_USE` through `DeleteRole`'s existing mapping. `FRONTEND_URL` (the frontend's own origin, for the link in the mail) is required config; see `.env.example`.

Each mail is a `BaseMail` subclass in its module's `mails/` (`access/mails/invitation_mail.ts` is the reference), rendering `resources/views/emails/<name>_html.edge` and `<name>_text.edge`. The HTML view wraps its sections in `@email.layout(...)` (`resources/views/components/email/layout.edge`), which holds the shared chrome and compiles to responsive HTML through the `@mjml` tag of `@adonisjs/mail`. The mail class translates with `i18nManager.locale(locale)` and passes the finished strings as view data, never a bound `t`: the views render in the queue worker from JSON, and a dropped `t` falls back to Edge's global `t()`, which only knows the default locale.

Send every mail with `mail.sendLater(...)`; the lint rejects `mail.send()`. `start/mail.ts` routes `sendLater` to `SendMailJob` (`core/jobs/send_mail.ts`), so the request only enqueues and the worker delivers with retries, surviving a mail-provider outage or a restart. In tests, `mail.fake()` renders queued mails inline: assert with `fake.mails.assertQueued(...)` and read them with `fake.mails.queued()`. Mailpit (http://localhost:8025) shows every mail sent in dev, and its HTML check scores client support.

### Platform admins

A user with a row in `platform_admins` passes every check in every tenant, and outside any tenant. `GET /api/v1/access/me` lists every permission for them, `platform.admin` included. No role or grant can hold `platform.admin`, and no endpoint creates a platform admin. Make one from `node ace repl`:

```ts
await import('#access/models/platform_admin').then(({ default: PlatformAdmin }) =>
  PlatformAdmin.create({ userId }),
)
```

### Tenant owner

`access` listens to `tenancy:tenant_created`: it creates the tenant's "Owner" role, named in the creator's locale (`access.owner_role`), with every permission but `platform.admin`, and assigns it to the creator. Both steps keep what exists, so the listener is safe to run again. A permission added to the catalog later doesn't reach existing Owner roles: grant it through `PUT /api/v1/roles/:id`, or with a data migration that also records a `role.updated` event per role it changes. `…_grant_audit_view_to_owner_roles.ts` is the reference: it adds `audit.view` to every role holding `roles.manage` and `members.manage` without it, as the system, and its `down()` keeps the grant.

`POST /api/v1/tenants` awaits the listener. If it throws, the request answers 500 with the tenant and the membership already committed, and the tenant has no Owner. Finish it from `node ace repl`:

```ts
await import('#access/actions/seed_tenant_owner').then(({ default: SeedTenantOwner }) =>
  new SeedTenantOwner().handle({ tenantId, creatorId, locale: 'en-US' }),
)
```

## Audit trail

Every successful write records one **audit event** in `audit_events`: what happened in business terms (`member.role_changed`), its subject, the display values of that moment, and who did it from which session. The app never updates or deletes an event.

### Record an event

1. **Declare the type** in the module's `types/audit.ts`, merging into `AuditEvents` from `#core/audit/types`. `TenantEvent<'role', { name: string }>` is listed on a tenant's trail; `AccountEvent<…>` belongs to no tenant (login, avatar). The data is a type alias of JSON values that holds display values (names, emails), so the event still reads after its subject changes or is deleted.
2. **Record it in the write's transaction**: `await audit.record(trx, 'role.deleted', { tenantId, subject: { type: 'role', id: role.id }, data: { name: role.name } })`, with `audit` from `#core/audit/main`. A rollback drops the event with the write. `audit.note(type, entry)` inserts on its own: use it only for an event with no row to share a transaction with (login, failed login, logout).
3. **Import the declarations** in that file: `import type {} from '#<module>/types/audit'`. The frontend compiles backend files through the API registry and sees only the declarations they import.

For an update, call `dirtyChanges(row, ['name', 'permissions'])` from `#core/audit/main` before `save()`: it returns `{ name: { from, to } }` for the named keys that changed. Keys named `password`, `token`, `tokenHash`, `token_hash`, `hash` or `secret` are stored as `'[redacted]'` at any depth.

The origin comes from the request. `audit_scope_middleware` (router stack, after `silent_auth`) runs the request in an AsyncLocalStorage scope, and each event reads its actor (`ctx.auth.user`), session (the access token's id), request id, IP and user agent when it is recorded. Login and sign-up pass `actorId`, and login `sessionId`, because the user appears during the request. Outside a request (repl, seeds, jobs) an event has no origin, and the trail shows it as the system.

### The guard

The same middleware fails a `POST`, `PUT`, `PATCH` or `DELETE` that answers 2xx without recording an event. Outside production it answers 500 `E_UNAUDITED_WRITE`, so the endpoint's first functional test names the missing call. In production, where the write is already committed, it logs an error. A refused write (4xx) needs no event; the functional test owns any event it does record, such as the failed login.

### Why not a mixin or a trigger

Lucid hooks run only inside an instance's `save()` and `delete()`, so a mixin misses the bulk `query().delete()` that `AssignRole` and `ReplaceGrants` use, and records row diffs instead of intent. A Postgres trigger has no actor, session or request unless every transaction sets them, and it records rows, not intent.

### Read a trail

`GET /api/v1/audit/events` (`auth`, `tenant`) lists the tenant's events newest first, paginated (`page`, `perPage` up to 100) and filtered by `type[]`, `actorId`, `subjectType`, `subjectId`, `from` and `to` (ISO 8601). Each row holds `actor` (the user, or `null` for the system), `session` (`id`, `ip`, `userAgent`, `requestId`), `createdAt`, and `event: { type, subject, data }`, a union the frontend narrows on `event.type`. It is nested because the inferred response type keeps a union inside a field, not at the top level of a row.

The whole trail needs `audit.view`. Every Owner role holds it: a new tenant's from the start, an older one through a migration (see [Tenant owner](#tenant-owner)). Account events are recorded, but no endpoint lists them yet.

A feature shows the history of its own records through the same endpoint, filtered by `subjectType` and `subjectId`. `SUBJECT_PERMISSIONS` in `app/audit/subject_permissions.ts` maps a subject type to the feature permission that may read its trail without `audit.view` (`role` to `roles.manage`). A new feature adds its subject type there.

### Jobs

No job records an event today. A job that writes on behalf of a request will carry the request's origin in its payload: add to `#core/audit/scope` a function that snapshots the current origin as plain values for the dispatch, and a scope the job runs its work in, built from that snapshot. A scheduled job records as the system.

## Translations

Every message a person reads comes from `resources/lang/<locale>/*.json`, in en-US (the default) and pt-BR. `config/i18n.ts` lists the supported locales. A request's locale is the first `Accept-Language` language whose primary subtag a supported locale shares (`pt-PT` reads pt-BR), else en-US; `ctx.i18n` holds it.

- **Exceptions**: give the exception a `code` and add `errors.<code>` to every locale. The exception handler translates it; the frameworks' own (`E_INVALID_CREDENTIALS`, `E_AUTHORIZATION_FAILURE`...) read the same keys. The class's `message` stays the English fallback for logs.
- **Responses built in code**: `ctx.i18n.t('<file>.<key>')`, as the tenant middleware does.
- **Validation**: `validator.json` holds one message per rule, written to read under any field label; the frontend shows it unchanged.
- **Work after the request** (mail, listeners, jobs): carry the request's `i18n.locale` in the event or job payload and translate with `i18nManager.locale(locale)`. `access:member_invited` is the reference.
- **Values**: ICU syntax (`{min}`); write apostrophes as `’`, since `'` escapes in ICU, and build HTML around the translated text instead of putting tags in it.

A unit test fails when a locale misses or adds a key.

## Health checks

Two endpoints, outside `/api/v1`:

- **`GET /health/live`** is the liveness probe for Docker (`HEALTHCHECK`) or an orchestrator. It answers 200 while the process serves HTTP and checks no dependency, so a database outage never turns into a restart loop.
- **`GET /health/ready`** is for monitoring. It requires the `x-monitoring-secret` header to equal `MONITORING_SECRET` (401 otherwise), runs every check in `start/health.ts`, and returns the report under `data`: 200 when every check passes, 503 when one fails. Each entry in `data.checks` carries its `name`, `status` (`ok`, `warning`, `error`), a `message` describing the result, and the measured values and thresholds in `meta`.

| Check                                | Fails when                                                                    | Thresholds (warn / fail) |
| ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------ |
| `Disk space check`                   | Disk usage crosses the threshold; cached for an hour.                         | 75% / 80%                |
| `Memory heap check`                  | V8 heap in use crosses the threshold.                                         | 250 MB / 300 MB          |
| `Memory RSS check`                   | Resident memory of the process crosses the threshold.                         | 320 MB / 350 MB          |
| `Database health check (pg)`         | Postgres refuses the connection.                                              |                          |
| `Connection count health check (pg)` | Connections on the whole server (`pg_stat_activity`) cross.                   | 70 / 90                  |
| `Storage check`                      | The S3 bucket can't be listed (unreachable, bad credentials, missing bucket). |                          |
| `Redis health check (main)`          | Redis doesn't answer on the `main` connection.                                |                          |

A new dependency the app can't serve without gets its own check, registered in `start/health.ts`; a custom one extends `BaseCheck` in `app/core/health_checks/`.

## Dependencies between modules

`apps/backend/modules.json` lists, per module, the other modules it may import. The lint enforces it (`no-restricted-imports`, generated in `oxlint.config.ts`), and the pre-commit hook runs that lint:

- A module imports itself, the modules listed for it, and `#start`, `#config`, `#database`, `#generated`. Its tests may also import `#tests`.
- Imports go through module aliases: `#app/*` and parent-relative paths (`../`) are rejected inside `app/`.
- A folder missing from `modules.json` can import no other module.

A new dependency is a reviewed decision: add it to `modules.json` in the same change, and never in a direction that would close a cycle. `core` depends on nothing.

## Naming feeds the generated registries

`indexEntities` (in `adonisrc.ts`) indexes `app/**/*_controller.ts` into `#generated/controllers`, grouped by module (`controllers.auth.AccessTokens`), and `app/**/*_transformer.ts` into the frontend's `Data` types (`Data.Users.User`). A file with another suffix is silently left out of both.

## Code conventions

- **Actions** (`actions/<verb>_<noun>.ts`): a default-exported class with one `async handle(input)`. `input` is a plain interface; never `HttpContext`. Return the primary value; throw the module's exceptions on expected failures. An action never calls another action: shared work becomes a service or a query.
- **Queries** (`queries/<verb>_<subject>.ts`): same shape as actions, read-only. One per business concept, not per screen.
- **Side effects through events**: mail, notifications, external HTTP, and anything another module reacts to are emitted as `<module>:<past_tense_verb>` events and handled in `start/events.ts`. Emit after the transaction commits, so listeners never see a rolled-back write.
- **Read-then-write races**: when a write derives a value from existing rows (next position, sequence number), lock the parent row with `forUpdate()` inside a transaction and back it with a `unique` constraint.
- **Transformers**: `toObject()` is the base shape; screen-specific shapes are variants named `for<Screen>` (`forList`, `forProfile`).
- **Validators**: one file per entity (`validators/<entity>.ts`), exporting one validator per use case.
