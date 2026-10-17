import { createFileRoute } from '@tanstack/react-router'
import { AccountActivity } from '@/features/audit/components/account-activity'
import { ProfilePage } from '@/features/users/components/profile-page'

export const Route = createFileRoute('/_app/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  return (
    <ProfilePage>
      <AccountActivity />
    </ProfilePage>
  )
}
