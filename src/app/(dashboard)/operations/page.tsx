import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OperationsClient } from './OperationsClient'
import { CalendarCheck, Plus } from 'lucide-react'
import { getOperationSettings } from '@/lib/operation-settings'

export default async function OperationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('id, business_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!staff) return null

  const { data: activeBranch } = await supabase
    .from('branches')
    .select('settings')
    .eq('id', staff.branch_id)
    .single()

  const operationSettings = getOperationSettings(activeBranch?.settings)
  if (!operationSettings.enabled) redirect('/dashboard')

  const today = new Date().toISOString().slice(0, 10)
  const bookingSelect = `
    id, booking_number, status, pickup_date, return_date, total_amount, balance_due,
    customer:customers(name, phone),
    booking_items(item_name, size, quantity)
  `

  const [
    { data: pickups },
    { data: returns },
    { data: fittings },
    { data: washing },
    { data: payments },
    { data: deliveries },
    { data: tasks },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select(bookingSelect)
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .in('status', ['booked', 'ready_for_pickup'])
      .lte('pickup_date', today)
      .order('pickup_date', { ascending: true })
      .limit(50),
    supabase
      .from('bookings')
      .select(bookingSelect)
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .in('status', ['out', 'delivered', 'return_due', 'overdue'])
      .lte('return_date', today)
      .order('return_date', { ascending: true })
      .limit(50),
    supabase
      .from('bookings')
      .select(bookingSelect)
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .in('status', ['booked', 'fitting_pending', 'alteration_pending'])
      .gte('fitting_at', `${today}T00:00:00+05:30`)
      .lte('fitting_at', `${today}T23:59:59+05:30`)
      .limit(50),
    supabase
      .from('washing_queue')
      .select('id, stage, priority, damage_found, created_at, items(name), booking:bookings(id, booking_number)')
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .neq('stage', 'ready')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('bookings')
      .select(bookingSelect)
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .gt('balance_due', 0)
      .not('status', 'in', '("closed","cancelled")')
      .limit(50),
    (supabase as any)
      .from('booking_delivery')
      .select('id, status, mode, booking:bookings(id, booking_number, status, pickup_date, return_date, total_amount, balance_due, customer:customers(name, phone), booking_items(item_name, size, quantity))')
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .in('status', ['pending', 'out_for_delivery', 'failed_delivery'])
      .limit(50),
    (supabase as any)
      .from('booking_tasks')
      .select('id, booking_id, title, status, priority, due_at, booking:bookings(id, booking_number)')
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .in('status', ['pending', 'doing', 'blocked'])
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(80),
  ])

  const blockedCount = (tasks || []).filter((task: any) => task.status === 'blocked').length
  const overdueCount = (returns || []).filter((booking: any) => booking.return_date < today).length

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Shop Floor Operations</h1>
          <p className="text-sm text-slate-500">Today’s pickups, returns, fittings, washing, delivery, payments, and staff tasks.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="border-0 bg-blue-50 text-blue-700">{pickups?.length || 0} pickups</Badge>
            <Badge className="border-0 bg-orange-50 text-orange-700">{returns?.length || 0} returns</Badge>
            <Badge className={blockedCount ? 'border-0 bg-red-50 text-red-700' : 'border-0 bg-emerald-50 text-emerald-700'}>{blockedCount} blocked</Badge>
            <Badge className={overdueCount ? 'border-0 bg-red-50 text-red-700' : 'border-0 bg-slate-100 text-slate-700'}>{overdueCount} overdue</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-10 rounded-full bg-white" asChild>
            <Link href="/bookings">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Bookings
            </Link>
          </Button>
          <Button size="sm" className="h-10 rounded-full bg-[#4f46e5] px-4 text-white hover:bg-[#4338ca]" asChild>
            <Link href="/bookings/new">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      <OperationsClient
        settings={operationSettings}
        pickups={(pickups || []) as any[]}
        returns={(returns || []) as any[]}
        fittings={(fittings || []) as any[]}
        washing={(washing || []) as any[]}
        payments={(payments || []) as any[]}
        deliveries={(deliveries || []) as any[]}
        tasks={(tasks || []) as any[]}
      />
    </div>
  )
}
