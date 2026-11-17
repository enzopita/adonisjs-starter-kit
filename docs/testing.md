# Testing policy

Every behavior has exactly one **owner**: the lowest layer that can observe it. A test belongs only in its behavior's owner; every other layer trusts that test and asserts only what is new at its own level.

## Layers and what they own

| Layer      | Where                                                          | Owns                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit       | `apps/backend/app/<module>/tests/unit`                         | Pure logic with its own rules: validator rules, transformers, model helpers, any function with branches.                                                                                  |
| Functional | `apps/backend/app/<module>/tests/functional` (Japa API client) | The HTTP contract: status codes, response shapes, auth guards, validation errors, database effects.                                                                                       |
| E2E        | `tests/*.e2e.ts`                                               | Wiring between frontend and backend that no lower layer sees: redirects, token storage, a screen calling the right endpoint and rendering its result. One test per critical user journey. |

Each layer up keeps the **happy path** of the layer below and spends its assertions on the seam it adds. The sign-in e2e test proves the form signs a member in and the profile renders; the functional suite owns wrong passwords, unknown emails, and malformed bodies; a unit test owns the password-length rule.

## Before adding a test

1. **Name the regression.** Write down the bug this test would catch that no existing test catches. No nameable regression, no test.
2. **Find the owner.** Pick the lowest layer that can observe that bug, then search it for a test of the same behavior; when one exists, extend it with the new case.
3. **Check the layers above.** When the new test makes an assertion higher up redundant, delete that assertion in the same change.

Done when every added test names its regression and owner, and no two tests assert the same behavior.

## Agent steps in e2e tests

`agent.act` and `agent.assert` run on Claude Code over ACP (`claudeCode()` in `e2e.config.ts`), with its own login, so the suite needs no API key. `agent.waitFor` and `agent.extract` never reach an executor: the runner judges them with the agents entry's `model`, which this config doesn't set, so they fail with `MODEL_UNAVAILABLE`. Don't use them:

- Instead of `agent.waitFor`, wait deterministically (`expect(...).toBeVisible()`, `expect(browser).toHaveURL()`, `locator.waitFor()`), then `agent.assert` if the check needs judgment.
- Instead of `agent.extract`, read the value through a locator or fetch it from the API helpers in `tests/support/api.ts`.

## Out of scope

Framework and library behavior (VineJS, Lucid, TanStack Router, the e2e runner), facts the type checker already enforces, static copy, and getters with no logic. Tests target this project's code.
