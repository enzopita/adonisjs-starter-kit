import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { BaseCommand, args, flags } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * Scaffolds app/<name>/ and wires every place a module must be registered.
 * None of them fail loudly when forgotten: a missing preload drops the routes,
 * a missing modules.json entry makes the lint reject every import of another
 * module.
 *
 * @example
 *   node ace make:module billing
 *   node ace make:module billing --events
 */
export default class MakeModule extends BaseCommand {
  static override commandName = 'make:module';
  static override description =
    'Scaffold app/<name>/ and register it (alias, preloads, modules.json)';
  static override options: CommandOptions = { startApp: false };

  @args.string({
    description: 'Module name in snake_case: billing, user_profile',
  })
  declare name: string;

  @flags.boolean({
    description:
      'Add start/events.ts + types/events.ts and preload the listeners',
  })
  declare events: boolean;

  private readonly touched: string[] = [];

  // oxlint-disable-next-line require-await -- BaseCommand types run() as returning a promise.
  override async run() {
    if (!/^[a-z][a-z0-9_]*$/u.test(this.name)) {
      this.logger.error(`Invalid module name "${this.name}": use snake_case`);
      this.exitCode = 1;

      return;
    }

    if (existsSync(this.app.makePath('app', this.name))) {
      this.logger.error(`app/${this.name}/ already exists`);
      this.exitCode = 1;

      return;
    }

    const { name } = this;

    this.create(
      'routes.ts',
      [
        `import router from '@adonisjs/core/services/router'`,
        `import { apiRoutes } from '#core/api_routes'`,
        ``,
        `apiRoutes(() => {`,
        `  router.group(() => {}).prefix('${name}').as('${name}')`,
        `})`,
        ``,
      ].join('\n')
    );

    if (this.events) {
      this.create(
        'types/events.ts',
        [
          `declare module '@adonisjs/core/types' {`,
          `  interface EventsList {}`,
          `}`,
          ``,
          `export {}`,
          ``,
        ].join('\n')
      );
      this.create(
        'start/events.ts',
        [
          `// Listeners for this module's events: emitter.on('${name}:<past_tense_verb>', ...)`,
          ``,
          `export {}`,
          ``,
        ].join('\n')
      );
    }

    this.registerAlias();
    this.registerPreloads();
    this.registerBoundary();

    // Generated code and rewritten JSON follow the repo style without hand-formatting here.
    execFileSync('pnpm', ['exec', 'oxfmt', ...this.touched], {
      cwd: this.app.makePath(),
    });

    this.logger.log('');
    this.logger.info(
      `app/${name}/ is registered. It may import core only: edit modules.json to add dependencies.`
    );
  }

  /** Writes a file under app/<name>/. */
  private create(relativePath: string, contents: string) {
    const filePath = this.app.makePath('app', this.name, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, contents);
    this.touched.push(filePath);
    this.logger.success(`create app/${this.name}/${relativePath}`);
  }

  /** Applies `transform` to a project file, failing the command when it changes nothing. */
  private patch(relativePath: string, transform: (source: string) => string) {
    const filePath = this.app.makePath(relativePath);
    const source = readFileSync(filePath, 'utf-8');
    const updated = transform(source);

    if (updated === source) {
      this.logger.error(
        `could not update ${relativePath}: register app/${this.name} there by hand`
      );
      this.exitCode = 1;

      return;
    }

    writeFileSync(filePath, updated);
    this.touched.push(filePath);
    this.logger.success(`update ${relativePath}`);
  }

  /** Adds `#<name>/*` next to the other module aliases in package.json. */
  private registerAlias() {
    this.patch('package.json', (source) => {
      // oxlint-disable-next-line typescript/no-unsafe-assignment -- JSON.parse returns any; package.json is the project's own, with an imports map.
      const pkg: { imports: Record<string, string> } = JSON.parse(source);
      const entries = Object.entries(pkg.imports);

      const lastModule = entries.findLastIndex(([, target]) =>
        /^\.\/app\/[^*]+\/\*\.js$/u.test(target)
      );

      entries.splice(lastModule + 1, 0, [
        `#${this.name}/*`,
        `./app/${this.name}/*.js`,
      ]);
      pkg.imports = Object.fromEntries(entries);

      return `${JSON.stringify(pkg, null, 2)}\n`;
    });
  }

  /** Appends the module's routes (and listeners) to the adonisrc.ts preloads. */
  private registerPreloads() {
    const lines = [
      `    // ${this.name}`,
      `    () => import('#${this.name}/routes'),`,
    ];

    if (this.events) {
      lines.push(`    () => import('#${this.name}/start/events'),`);
    }

    this.patch('adonisrc.ts', (source) =>
      source.replace(
        /(?<body>preloads:\s*\[[\s\S]*?)(?<close>\n {2}\],)/u,
        (_match, body: string, close: string) =>
          `${body}\n\n${lines.join('\n')}${close}`
      )
    );
  }

  /** Registers the module in modules.json, the dependency map the lint enforces. */
  private registerBoundary() {
    this.patch('modules.json', (source) => {
      // oxlint-disable-next-line typescript/no-unsafe-assignment -- JSON.parse returns any; modules.json maps each module to its dependencies.
      const modules: Record<string, string[]> = JSON.parse(source);
      modules[this.name] = ['core'];

      return `${JSON.stringify(modules, null, 2)}\n`;
    });
  }
}
