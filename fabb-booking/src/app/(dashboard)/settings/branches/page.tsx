import { BranchesClient } from './BranchesClient'

export const metadata = { title: 'Branches | Fabb.booking' }

export default function BranchesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Branches</h2>
        <p className="text-sm text-slate-500">Manage your store locations and branch-level settings.</p>
      </div>
      <BranchesClient />
    </div>
  )
}
