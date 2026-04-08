import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, CreditCard, IndianRupee } from 'lucide-react'
import Link from 'next/link'

const METHOD_ICONS: Record<string, string> = {
  cash: '💵',
  upi: '📱',
  card: '💳',
  bank_transfer: '🏦',
  other: '📝',
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id, role').eq('id', user.id).single()
  if (!staff) return null

  const { data: payments, count } = await supabase
    .from('booking_payments')
    .select(`
      id, type, amount, method, notes, created_at,
      booking:bookings(id, booking_number, business_id, customer:customers(name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  // Filter by business
  const businessPayments = payments?.filter((p) => {
    const booking = Array.isArray(p.booking) ? p.booking[0] : p.booking
    return booking?.business_id === staff.business_id
  }) || []

  // Today's total
  const today = new Date().toISOString().split('T')[0]
  const todayTotal = businessPayments
    .filter((p) => p.created_at?.startsWith(today))
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500">{count ?? 0} payments recorded</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/payments/new">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Today&apos;s Collections</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">₹{todayTotal.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search payments..." className="pl-10 h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Payment list */}
      <Card>
        <CardContent className="p-0">
          {businessPayments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {businessPayments.map((payment) => {
                const booking = Array.isArray(payment.booking) ? payment.booking[0] : payment.booking
                const customer: any = booking?.customer
                const customerName = Array.isArray(customer) ? customer[0]?.name : customer?.name

                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg">
                        {METHOD_ICONS[payment.method] || '💰'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {booking?.booking_number || 'Payment'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customerName || 'Customer'} · {payment.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-700">+₹{Number(payment.amount).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">No payments recorded</h3>
              <p className="text-sm text-slate-500 mt-1">Payments will appear here once bookings are made.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
