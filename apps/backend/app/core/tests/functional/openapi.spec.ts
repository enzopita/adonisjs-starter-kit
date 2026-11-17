import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

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
  if (!schema) return false;

  if (schema.$ref) return schema.$ref === VALIDATION_ERROR_REF;

  if (schema.oneOf) return schema.oneOf.every(isErrorBody);

  const keys = (names: Iterable<string>) => [...names].toSorted().join();

  return (
    keys(Object.keys(schema.properties ?? {})) === 'code,message' &&
    keys(schema.required ?? []) === 'code,message'
  );
}

test.group('Core | OpenAPI document', () => {
  // A child process, because other specs register closure routes under /__tests/ on the shared router.
  test('matches the committed openapi.json with no diagnostics', async ({
    assert,
  }) => {
    await promisify(execFile)(
      process.execPath,
      ['ace', 'openapi:check', '--strict'],
      {
        cwd: app.makePath(),
      }
    ).catch((error: { stdout: string; stderr: string }) =>
      assert.fail(error.stdout + error.stderr)
    );
  }).timeout(60000);

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
            .map(
              ([status, response]) =>
                [
                  status,
                  '$ref' in response
                    ? document.components!.responses![
                        response.$ref.split('/').pop()!
                      ]!
                    : response,
                ] as const
            )
            .filter(
              ([, response]) =>
                !isErrorBody(response.content?.['application/json']?.schema)
            )
            .map(([status]) => `${method.toUpperCase()} ${path} ${status}`)
        )
    );

    assert.deepEqual(problems, []);
  }).timeout(20000);
});
