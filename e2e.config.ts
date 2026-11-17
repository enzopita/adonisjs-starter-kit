import type { E2EConfig } from 'e2e'
import { web } from '@e2e-dev/web'
import { claudeCode } from '@e2e-dev/acp'

export default {
  // agent.* steps run on Claude Code over ACP with its own login (`claude`), or ANTHROPIC_API_KEY when set.
  agents: {
    default: {
      executor: claudeCode({
        model: 'sonnet',
        system: 'You are a thorough QA agent. Verify every outcome.',
      }),
    },
  },
  targets: [
    {
      // The tests assert English copy and UTC times; without these they follow the machine's
      // language and zone, like the backend's TZ=UTC.
      engine: web({ locale: 'en-US', timezoneId: 'UTC' }),
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
