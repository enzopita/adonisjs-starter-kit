import type { SystemEvent } from '#core/audit/types'

declare module '#core/audit/types' {
  interface AuditEvents {
    'audit.pruned': SystemEvent<{ count: number; before: string }>
  }
}
