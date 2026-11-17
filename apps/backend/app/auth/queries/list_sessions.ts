import db from '@adonisjs/lucid/services/db'

export interface SessionRow {
  id: string
  userAgent: string | null
  ipAddress: string | null
  createdAt: Date
  lastUsedAt: Date | null
  current: boolean
}

export interface ListSessionsInput {
  userId: string
  currentTokenId: string
}

/** The user's own sessions, newest-used first, excluding impersonation tokens and expired ones. */
export default class ListSessions {
  async handle({ userId, currentTokenId }: ListSessionsInput) {
    const rows = await db
      .query<Omit<SessionRow, 'current'>>()
      .from('auth_access_tokens')
      .where('tokenable_id', userId)
      .whereNull('impersonator_id')
      .where(query => query.whereNull('expires_at').orWhere('expires_at', '>', new Date()))
      .orderByRaw('last_used_at desc nulls last')
      .orderBy('created_at', 'desc')
      .select(
        'id',
        'user_agent as userAgent',
        'ip_address as ipAddress',
        'created_at as createdAt',
        'last_used_at as lastUsedAt',
      )

    return rows.map(row => ({ ...row, current: row.id === currentTokenId }))
  }
}
