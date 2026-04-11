import { redirect } from 'next/navigation'

// Staff management is handled under the main /staff route
// This redirects from settings sidebar to the dedicated staff page
export default function SettingsStaffPage() {
  redirect('/staff')
}
