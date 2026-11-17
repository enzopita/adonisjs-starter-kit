import db from '@adonisjs/lucid/services/db';

import type {} from '#auth/types/audit';
import { audit } from '#core/audit/main';
import User from '#users/models/user';

export interface RevokeSessionsInput {
  user: User;
  /** Only this session, instead of every one. */
  sessionId?: string;
  /** The token to leave untouched, typically the one making the request. */
  keepTokenId?: string;
}

/**
 * Signs a user out of every device but the one kept, for the user's own request and for actions
 * that must do it on their behalf (password reset, enabling 2FA). Never touches an impersonation
 * token: that session belongs to the admin, not the user.
 */
export default class RevokeSessions {
  async handle({ user, sessionId, keepTokenId }: RevokeSessionsInput) {
    const query = db
      .from('auth_access_tokens')
      .where('tokenable_id', user.id)
      .whereNull('impersonator_id');

    if (sessionId) query.where('id', sessionId);

    if (keepTokenId) query.whereNot('id', keepTokenId);

    const rows: { id: string }[] = await query.select('id');

    for (const row of rows) {
      await User.accessTokens.delete(user, row.id);

      await audit.note('auth.session_revoked', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        sessionId: row.id,
        data: { email: user.email },
      });
    }

    return rows.length;
  }
}
