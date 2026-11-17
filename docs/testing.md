# Testing policy

Every behavior has one **owner**: the lowest layer that can observe it. Tests live only there; higher layers trust it and assert only their own seam.

| Layer | Where | Owns |
| --- | --- | --- |
| Unit | `apps/backend/app/<module>/tests/unit` | Pure logic with rules: validators, transformers, model helpers, any branching function. |
| Functional | `apps/backend/app/<module>/tests/functional` (Japa) | HTTP contract: statuses, response shapes, auth guards, validation errors, database effects. |
| E2E | `tests/*.e2e.ts` | Frontend/backend wiring: redirects, token storage, a screen calling and rendering its endpoint. One test per critical journey. |

Each layer keeps only the **happy path** of the one below. Example: sign-in e2e proves the form signs in and the profile renders; functional owns wrong password, unknown email, bad body; unit owns the password-length rule.

## Before adding a test

1. **Name the regression** no existing test catches. None → no test.
2. **Find the owner** layer; extend an existing test of the same behavior.
3. **Delete** assertions above that the new test makes redundant, same change.

Done: every added test names its regression and owner; no behavior asserted twice.

## Agent steps in e2e tests

`agent.waitFor` and `agent.extract` fail with `MODEL_UNAVAILABLE`: the ACP executor (`claudeCode()` in `e2e.config.ts`) runs `agent.act` and `agent.assert` but exposes no judge model. Instead:

- Wait deterministically (`expect(...).toBeVisible()`, `expect(browser).toHaveURL()`, `locator.waitFor()`), then `agent.assert` if judgment is needed.
- Read values through a locator or `tests/support/api.ts`.

## Out of scope

Framework and library behavior (VineJS, Lucid, TanStack Router, the e2e runner), what the type checker enforces, static copy, logic-free getters.
