import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Waves } from 'lucide-react'
import { WashingQueueClient } from './WashingQueueClient'
import { WashLogDialog } from './WashLogDialog'

export default async function WashingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('id, business_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!staff) return null

  // Fetch pending items in washing_queue
  // Priority order: urgent first, then normal, then low
  const { data: washLogs, count } = await supabase
    .from('washing_queue')
    .select(`
      *,
      items(name, sku),
      item_variants(size, colour)
    `, { count: 'exact' })
    .eq('branch_id', staff.branch_id)
    .order('priority', { ascending: false }) // This is a text sort, but urgent > normal > low alphabetically doesn't work.
    .order('created_at', { ascending: false })
    .limit(100)

  // Manual sort for priority since it's a text field with values: urgent, normal, low
  const sortedLogs = (washLogs || []).sort((a, b) => {
    const priorityMap: any = { urgent: 0, normal: 1, low: 2 }
    return priorityMap[a.priority] - priorityMap[b.priority]
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Washing Queue</h1>
          <p className="text-sm text-slate-500">
            {count ?? 0} items total · {sortedLogs.filter(l => l.stage === 'in_washing').length} currently washing
          </p>
        </div>
        <WashLogDialog 
          businessId={staff.business_id} 
          branchId={staff.branch_id} 
          staffId={staff.id} 
        />
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search items in queue..." className="pl-10 h-9" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md bg-slate-50/50 text-xs text-slate-600">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Urgent First
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <WashingQueueClient initialLogs={sortedLogs} staffId={staff.id} />
    </div>
  )
}
