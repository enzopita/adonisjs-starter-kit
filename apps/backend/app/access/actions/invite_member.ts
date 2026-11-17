import emitter from '@adonisjs/core/services/emitter';
import db from '@adonisjs/lucid/services/db';
import { DateTime } from 'luxon';

import AlreadyMemberException from '#access/exceptions/already_member_exception';
import Invitation from '#access/models/invitation';
import Role from '#access/models/role';
import { roleSnapshot } from '#access/snapshots';
import type {} from '#access/types/audit';
import type { MemberInvited } from '#access/types/events';
import { audit } from '#core/audit/main';
import { newToken } from '#core/tokens';
import User from '#users/models/user';
import { mailLocaleFor } from '#users/services/mail_locale';

export interface InviteMemberInput {
  tenantId: string;
  email: string;
  roleId: string | null;
  invitedById: string;
  locale: string;
}

export const EXPIRY = { days: 7 };

export default class InviteMember {
  /**
   * Upserts on (tenantId, email): re-inviting refreshes the token, role, inviter and expiry
   * instead of failing. Emits after commit, so the mail always points at a stored invitation.
   */
  async handle({
    tenantId,
    email,
    roleId,
    invitedById,
    locale,
  }: InviteMemberInput) {
    const alreadyMember = await db
      .query<{ user_id: string }>()
      .from('tenant_memberships')
      .join('users', 'users.id', 'tenant_memberships.user_id')
      .where('tenant_memberships.tenant_id', tenantId)
      .where('users.email', email)
      .first();

    if (alreadyMember) {
      throw new AlreadyMemberException();
    }

    const { raw: token, hash: tokenHash } = newToken();

    const invitation = await db.transaction(async (trx) => {
      const upserted = await Invitation.updateOrCreate(
        { tenantId, email },
        {
          roleId,
          tokenHash,
          invitedById,
          expiresAt: DateTime.now().plus(EXPIRY),
        },
        { client: trx }
      );

      const role =
        roleId === null ? null : await Role.findOrFail(roleId, { client: trx });

      await audit.record(trx, 'invitation.sent', {
        tenantId,
        subject: { type: 'invitation', id: upserted.id },
        data: { email, role: roleSnapshot(role) },
      });

      return upserted;
    });

    // The recipient may not have an account yet; one who already does gets mailed in their own
    // locale rather than the inviter's.
    const existing = await User.findBy('email', email);

    await emitter.emit('access:member_invited', {
      email,
      token,
      locale: mailLocaleFor(existing, locale),
    } satisfies MemberInvited);

    return invitation;
  }
}
