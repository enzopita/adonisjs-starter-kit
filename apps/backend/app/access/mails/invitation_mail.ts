import { EXPIRY } from '#access/actions/invite_member';
import { LinkMail } from '#core/mails/link_mail';

export default class InvitationMail extends LinkMail {
  protected prefix = 'access.invitation_mail';
  protected view = 'invitation';
  protected expiresIn = { days: EXPIRY.days };
}
