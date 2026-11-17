import emitter from '@adonisjs/core/services/emitter';
import db from '@adonisjs/lucid/services/db';

import { openSession } from '#auth/services/sessions';
import { issueUserToken } from '#auth/services/user_tokens';
import type {} from '#auth/types/audit';
import type {} from '#auth/types/events';
import { audit } from '#core/audit/main';
import User from '#users/models/user';
import { mailLocaleFor } from '#users/services/mail_locale';

export interface SignUpInput {
  fullName: string | null;
  email: string;
  password: string;
  /** The request's locale when the client sent none. */
  locale: string;
  timezone: string | null;
  userAgent: string | undefined;
  ipAddress: string;
}

/** Creates the account, mails its verification link, and opens its first session. */
export default class SignUp {
  async handle({
    fullName,
    email,
    password,
    locale,
    timezone,
    userAgent,
    ipAddress,
  }: SignUpInput) {
    const { user, verificationToken } = await db.transaction(async (trx) => {
      const created = await User.create(
        { fullName, email, password, locale, timezone },
        { client: trx }
      );

      await audit.record(trx, 'auth.signed_up', {
        tenantId: null,
        subject: { type: 'user', id: created.id },
        actorId: created.id,
        data: { email, fullName },
      });

      return {
        user: created,
        verificationToken: await issueUserToken(
          trx,
          created.id,
          'email_verification'
        ),
      };
    });

    await emitter.emit('auth:email_verification_requested', {
      email,
      token: verificationToken,
      locale: mailLocaleFor(user, locale),
    });

    const token = await openSession({ user, userAgent, ipAddress });

    return { user, token };
  }
}
