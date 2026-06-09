import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/current-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FilePenLine, Plus } from 'lucide-react'
import { getOperationSettings } from '@/lib/operation-settings'

export default async function BookingDraftsPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('id, business_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!staff) return null

  const [{ data: branch }, { data: drafts }] = await Promise.all([
    supabase
      .from('branches')
      .select('settings')
      .eq('id', staff.branch_id)
      .single(),
    supabase
      .from('booking_drafts')
      .select('id, draft_data, updated_at')
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .eq('staff_id', staff.id)
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  const operationSettings = getOperationSettings(branch?.settings)
  if (!operationSettings.enabled || !operationSettings.draftList) redirect('/bookings')

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Booking Drafts</h1>
          <p className="text-sm text-slate-500">Resume saved bookings from this counter login.</p>
        </div>
        <Button asChild className="bg-[#4f46e5] text-white hover:bg-[#4338ca]">
          <Link href="/bookings/new"><Plus className="mr-2 h-4 w-4" />New booking</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {(drafts || []).map((draft: any) => {
          const data = draft.draft_data || {}
          const customer = data.customer || {}
          const items = data.items || []
          return (
            <Card key={draft.id} className="border-none bg-white shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FilePenLine className="h-4 w-4 text-amber-500" />
                    <p className="font-semibold text-slate-950">{customer.name || customer.phone || 'Untitled booking draft'}</p>
                    <Badge variant="outline">Step {Math.min((Number(data.currentStep || 0) + 1), 5)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {items.length} item{items.length === 1 ? '' : 's'}
                    {data.dates?.pickup_date ? ` · pickup ${data.dates.pickup_date}` : ''}
                    {data.pricing?.total_amount ? ` · ₹${Number(data.pricing.total_amount).toLocaleString('en-IN')}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Saved {new Date(draft.updated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/bookings/new">Resume latest</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
        {(!drafts || drafts.length === 0) && (
          <Card className="border-none bg-white shadow-sm">
            <CardContent className="py-12 text-center text-sm text-slate-500">No saved booking drafts.</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
