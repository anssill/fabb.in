import { getNotifications } from './notification-actions'
import { NotificationsList } from './NotificationsList'

export const metadata = { title: 'Notifications | Fabb.booking' }
export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div className="mx-auto max-w-[960px]">
      <NotificationsList initialNotifications={notifications} />
    </div>
  )
}
