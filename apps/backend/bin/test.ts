import 'reflect-metadata';
import { Ignitor, prettyPrintError } from '@adonisjs/core/ignitor';
import { configure, processCLIArgs, run } from '@japa/runner';

process.env.NODE_ENV = 'test';

const APP_ROOT = new URL('../', import.meta.url);

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href);
  }

  return import(filePath);
};

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env');
    });
    app.listen('SIGTERM', () => {
      void app.terminate();
    });
    app.listenIf(app.managedByPm2, 'SIGINT', () => {
      void app.terminate();
    });
  })
  .testRunner()
  .configure(async (app) => {
    const { runnerHooks, ...config } = await import('../tests/bootstrap.js');

    processCLIArgs(process.argv.splice(2));
    configure({
      ...app.rcFile.tests,
      ...config,
      setup: runnerHooks.setup,
      teardown: [...runnerHooks.teardown, () => app.terminate()],
    });
  })
  .run(() => run())
  // oxlint-disable-next-line promise/prefer-await-to-callbacks, anti-slop/no-unknown-parameters -- a rejection handler takes whatever was thrown; a top-level await instead would keep a long-running command's module pending.
  .catch(async (error: unknown) => {
    process.exitCode = 1;
    await prettyPrintError(error);
  });
