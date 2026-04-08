import { getNotifications } from './notification-actions'
import { NotificationsList } from './NotificationsList'

export const metadata = { title: 'Notifications | Fabb.booking' }
export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div className="max-w-4xl mx-auto">
      <NotificationsList initialNotifications={notifications} />
    </div>
  )
}
