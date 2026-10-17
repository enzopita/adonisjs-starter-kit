import type { MemberSnapshot } from '#access/types/audit'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import MemberNotFoundException from '#access/exceptions/member_not_found_exception'

export interface GetMemberInput {
  tenantId: string
  userId: string
}

export default class GetMember {
  async handle(
    trx: TransactionClientContract,
    { tenantId, userId }: GetMemberInput,
  ): Promise<MemberSnapshot> {
    const member: MemberSnapshot | null = await trx
      .from('tenant_memberships')
      .join('users', 'users.id', 'tenant_memberships.user_id')
      .where('tenant_memberships.tenant_id', tenantId)
      .where('tenant_memberships.user_id', userId)
      .select('users.email', 'users.full_name as fullName')
      .first()

    if (!member) throw new MemberNotFoundException()

    return member
  }
}
