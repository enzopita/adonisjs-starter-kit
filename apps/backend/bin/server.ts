await import('reflect-metadata');

const { Ignitor, prettyPrintError } = await import('@adonisjs/core/ignitor');

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
  .httpServer()
  .start()
  // oxlint-disable-next-line promise/prefer-await-to-callbacks, anti-slop/no-unknown-parameters -- a rejection handler takes whatever was thrown; a top-level await instead would keep a long-running command's module pending.
  .catch(async (error: unknown) => {
    process.exitCode = 1;
    await prettyPrintError(error);
  });
