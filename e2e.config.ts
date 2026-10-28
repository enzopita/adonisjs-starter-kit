import type { E2EConfig } from 'e2e'
import { web } from '@e2e-dev/web'
import { openrouter } from '@openrouter/ai-sdk-provider'
import { existsSync } from 'node:fs'

// Local secrets such as OPENROUTER_API_KEY; CI sets them in the environment instead.
if (existsSync('.env')) process.loadEnvFile('.env')

export default {
  // agent.* steps need OPENROUTER_API_KEY: put it in a root .env or the environment.
  // Without it, tests/auth.e2e.ts fails at its logout step with MODEL_PROVIDER_FAILED.
  agents: {
    default: {
      model: openrouter('openai/gpt-6-luna'),
      system: 'You are a thorough QA agent. Verify every outcome.',
    },
  },
  targets: [
    {
      // The tests assert English copy; without this they follow the machine's language.
      engine: web({ locale: 'en-US' }),
      app: {
        url: 'http://localhost:5173',
        readyUrl: 'http://localhost:3333/',
        command: {
          // The runner spawns without a shell, and Windows only runs pnpm's `.cmd` shim through one.
          // Its default environment also misses the Windows variables tools locate their files by
          // (docker finds its compose plugin under ProgramFiles and USERPROFILE). The runner only
          // documents WSL for Windows, so this works around e2e itself; it also stops just cmd.exe
          // when a run ends, leaving `pnpm dev` up on 3333 and 5173.
          ...(process.platform === 'win32'
            ? {
                executable: 'cmd.exe',
                args: ['/d', '/s', '/c', 'pnpm dev --ui=stream'],
                inheritEnv: [
                  'USERPROFILE',
                  'APPDATA',
                  'LOCALAPPDATA',
                  'ProgramData',
                  'ProgramFiles',
                  'ProgramFiles(x86)',
                  'ProgramW6432',
                  'SystemDrive',
                  'PATHEXT',
                ],
              }
            : { executable: 'pnpm', args: ['dev', '--ui=stream'] }),
          startupTimeout: 120_000,
          log: '.e2e/logs/app.log',
        },
      },
    },
  ],
} satisfies E2EConfig
