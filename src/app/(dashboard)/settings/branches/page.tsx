import { createClient } from '@/lib/supabase/server'
import { BranchesClient } from './BranchesClient'

export const metadata = { title: 'Branches | Fabb.booking' }

export default async function BranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch staff list for manager selection
  const { data: staff } = await supabase
    .from('staff')
    .select('id, name, email')
    .order('name')

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Branches</h2>
        <p className="text-sm text-slate-500">Manage your store locations and branch-level settings.</p>
      </div>
      <BranchesClient initialStaff={staff || []} />
    </div>
  )
}
