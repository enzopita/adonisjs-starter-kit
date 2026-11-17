import { spawnSync } from 'node:child_process';

import app from '@adonisjs/core/services/app';
import router from '@adonisjs/core/services/router';
import { generateDocument } from '@enzopita/adonisjs-openapi';
import type { OpenApiConfig } from '@enzopita/adonisjs-openapi/types';
import { test } from '@japa/runner';

type Schema = {
  $ref?: string;
  oneOf?: Schema[];
  properties?: object;
  required?: string[];
};

const VALIDATION_ERROR_REF = '#/components/schemas/ValidationError';

function isErrorBody(schema: Schema | undefined): boolean {
  if (schema === undefined) {
    return false;
  }

  if (schema.$ref) {
    return schema.$ref === VALIDATION_ERROR_REF;
  }

  if (schema.oneOf) {
    return schema.oneOf.every(isErrorBody);
  }

  return (
    keys(Object.keys(schema.properties ?? {})) === 'code,message' &&
    keys(schema.required ?? []) === 'code,message'
  );
}

function keys(names: Iterable<string>) {
  return [...names].toSorted().join(',');
}

test.group('Core | OpenAPI document', () => {
  // A child process, because other specs register closure routes under /__tests/ on the shared router.
  test('matches the committed openapi.json with no diagnostics', ({
    assert,
  }) => {
    const check = spawnSync(
      process.execPath,
      ['ace', 'openapi:check', '--strict'],
      { cwd: app.makePath(), encoding: 'utf-8' }
    );

    assert.equal(check.status, 0, check.stdout + check.stderr);
  }).timeout(60_000);

  test('answers every 4xx and 5xx with { code, message } or a validation error', async ({
    assert,
  }) => {
    const { document } = await generateDocument(
      app,
      router,
      app.config.get<OpenApiConfig>('openapi')
    );

    const problems = Object.entries(document.paths).flatMap(
      ([path, operations]) =>
        Object.entries(operations).flatMap(([method, operation]) =>
          Object.entries(operation.responses)
            .filter(([status]) => Number(status) >= 400)
            // The readiness probe answers 503 with the health report, not an error.
            .filter(
              ([status]) =>
                !(
                  method === 'get' &&
                  path === '/health/ready' &&
                  status === '503'
                )
            )
            .map(([status, response]) => {
              if (!('$ref' in response)) {
                return [status, response] as const;
              }

              const resolved =
                document.components.responses?.[
                  response.$ref.split('/').pop() ?? ''
                ];

              if (resolved === undefined) {
                throw new Error(`${response.$ref} is not in components`);
              }

              return [status, resolved] as const;
            })
            .filter(
              ([, response]) =>
                !isErrorBody(response.content?.['application/json']?.schema)
            )
            .map(([status]) => `${method.toUpperCase()} ${path} ${status}`)
        )
    );

    assert.deepEqual(problems, []);
  }).timeout(20_000);
});
