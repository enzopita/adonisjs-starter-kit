import type { AccountEvent, SystemEvent } from '#core/audit/types'

declare module '#core/audit/types' {
  interface AuditEvents {
    'attachment.uploaded': AccountEvent<'attachment', { name: string; size: number }>
    'attachment.pruned': SystemEvent<{ count: number }>
  }
}
