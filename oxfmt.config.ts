import { defineConfig } from 'oxfmt';
import ultracite from 'ultracite/oxfmt';

export default defineConfig({
  ...ultracite,
  singleQuote: true,
  ignorePatterns: [
    ...ultracite.ignorePatterns,
    '**/.adonisjs/**',
    // Rewritten by tools: `e2e init` (skill) and the e2e runner (replay cache).
    '.agents/skills/e2e/**',
    '.e2e/**',
    // Written by `node ace openapi:generate`, which `openapi:check` compares byte for byte.
    'apps/backend/openapi.json',
    // Rewritten by `node ace migration:run`.
    'apps/backend/database/schema.ts',
    // Vendored from upstream (see its UPSTREAM.md), kept byte for byte.
    'tools/oxlint/anti-slop/**',
  ],
});
