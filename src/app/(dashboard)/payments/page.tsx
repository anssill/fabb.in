'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Search, CreditCard, ClipboardList, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

const METHOD_ICONS: Record<string, string> = {
  cash: '💵',
  upi: '📱',
  card: '💳',
  bank_transfer: '🏦',
  other: '📝',
}

const TYPE_COLORS: Record<string, string> = {
  advance: 'bg-blue-100 text-blue-700',
  balance: 'bg-violet-100 text-violet-700',
  deposit: 'bg-amber-100 text-amber-700',
  deposit_refund: 'bg-emerald-100 text-emerald-700',
  penalty: 'bg-red-100 text-red-700',
  refund: 'bg-emerald-100 text-emerald-700',
}

const TYPE_LABELS: Record<string, string> = {
  advance: 'Advance',
  balance: 'Balance',
  deposit: 'Security Deposit',
  deposit_refund: 'Deposit Refund',
  penalty: 'Penalty',
  refund: 'Refund',
}

export default function PaymentsPage() {
  const { activeBranch } = useAppStore()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [role, setRole] = useState('')

  // Reconciliation sheet state
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [reconcileDate, setReconcileDate] = useState(new Date().toISOString().split('T')[0])
  const [cashCounted, setCashCounted] = useState('')
  const [reconcileNotes, setReconcileNotes] = useState('')
  const [reconcileSaving, setReconcileSaving] = useState(false)

  useEffect(() => {
    async function fetchPayments() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staff } = await supabase
        .from('staff')
        .select('business_id, branch_id, role')
        .eq('id', user.id)
        .single()
      if (!staff) return
      setRole(staff.role)

      const { data } = await supabase
        .from('booking_payments')
        .select(`
          id, type, amount, method, notes, created_at, is_voided, collected_by,
          booking:bookings(id, booking_number, customer:customers(name, phone)),
          staff:staff!booking_payments_collected_by_fkey(name)
        `)
        .eq('business_id', staff.business_id)
        .eq('branch_id', activeBranch?.id || staff.branch_id)
        .order('created_at', { ascending: false })
        .limit(200)

      setPayments(data || [])
      setLoading(false)
    }
    fetchPayments()
  }, [activeBranch?.id])

  const today = new Date().toISOString().split('T')[0]

  const todayTotal = useMemo(() =>
    payments.filter(p => !p.is_voided && p.created_at?.startsWith(today))
      .reduce((sum, p) => sum + Number(p.amount), 0), [payments, today])

  const monthTotal = useMemo(() => {
    const month = today.slice(0, 7)
    return payments.filter(p => !p.is_voided && p.created_at?.startsWith(month))
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }, [payments, today])

  const depositsHeld = useMemo(() =>
    payments.filter(p => !p.is_voided && p.type === 'deposit')
      .reduce((sum, p) => sum + Number(p.amount), 0), [payments])

  const depositsReturned = useMemo(() =>
    payments.filter(p => !p.is_voided && p.type === 'deposit_refund')
      .reduce((sum, p) => sum + Number(p.amount), 0), [payments])

  const cashToday = useMemo(() =>
    payments.filter(p => !p.is_voided && p.method === 'cash' && p.created_at?.startsWith(reconcileDate))
      .reduce((sum, p) => sum + Number(p.amount), 0), [payments, reconcileDate])

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false
      if (methodFilter !== 'all' && p.method !== methodFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const booking = Array.isArray(p.booking) ? p.booking[0] : p.booking
        const customer: any = booking?.customer
        const customerName = Array.isArray(customer) ? customer[0]?.name : customer?.name
        return (
          booking?.booking_number?.toLowerCase().includes(q) ||
          customerName?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [payments, search, typeFilter, methodFilter])

  async function handleSaveReconciliation() {
    setReconcileSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
      if (!staff) return

      const counted = parseFloat(cashCounted) || 0
      const difference = counted - cashToday

      await supabase.from('audit_log').insert({
        business_id: staff.business_id,
        staff_id: user.id,
        action: 'cash_reconciliation',
        resource_type: 'payments',
        new_value: {
          date: reconcileDate,
          cash_expected: cashToday,
          cash_counted: counted,
          difference,
          notes: reconcileNotes,
        },
      })

      toast.success('Reconciliation saved')
      setReconcileOpen(false)
      setCashCounted('')
      setReconcileNotes('')
    } catch {
      toast.error('Failed to save reconciliation')
    } finally {
      setReconcileSaving(false)
    }
  }

  const isManager = ['owner', 'manager', 'super_admin'].includes(role)

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Payments</h1>
          <p className="text-sm text-slate-500">{payments.length} transactions recorded</p>
        </div>
        {isManager && (
          <Button variant="outline" className="h-10 px-4" onClick={() => setReconcileOpen(true)}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Reconcile
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {isManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Revenue Today</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">₹{todayTotal.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Revenue This Month</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">₹{monthTotal.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Deposits Held</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">₹{(depositsHeld - depositsReturned).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Total Collected</p>
              <p className="text-2xl font-semibold text-emerald-600 mt-1">₹{payments.filter(p => !p.is_voided).reduce((s, p) => s + Number(p.amount), 0).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by booking number or customer..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="deposit_refund">Deposit Refund</SelectItem>
                <SelectItem value="penalty">Penalty</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading payments...</div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filtered.map((payment) => {
                const booking = Array.isArray(payment.booking) ? payment.booking[0] : payment.booking
                const customer: any = booking?.customer
                const customerName = Array.isArray(customer) ? customer[0]?.name : customer?.name
                const staffName = Array.isArray(payment.staff) ? payment.staff[0]?.name : payment.staff?.name

                return (
                  <div key={payment.id} className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${payment.is_voided ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-lg border border-slate-100">
                        {METHOD_ICONS[payment.method] || '💰'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900 font-mono">
                            {booking?.booking_number || 'Payment'}
                          </p>
                          <Badge className={`text-[10px] px-1.5 py-0 border-transparent ${TYPE_COLORS[payment.type] || 'bg-slate-100 text-slate-600'}`}>
                            {payment.is_voided ? 'VOIDED' : (TYPE_LABELS[payment.type] || payment.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {customerName || 'Customer'} · {payment.method?.replace('_', ' ')}
                          {staffName ? ` · ${staffName}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${payment.type?.includes('refund') ? 'text-red-600' : 'text-emerald-700'}`}>
                        {payment.type?.includes('refund') ? '-' : '+'}₹{Number(payment.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">
                {search || typeFilter !== 'all' || methodFilter !== 'all' ? 'No matching payments' : 'No payments recorded'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {search ? 'Try a different search.' : 'Payments will appear here once bookings are made.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation Sheet */}
      <Sheet open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Cash Reconciliation</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="rec-date">Date</Label>
              <Input
                id="rec-date"
                type="date"
                value={reconcileDate}
                onChange={(e) => setReconcileDate(e.target.value)}
                max={today}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Cash Expected</span>
                <span className="text-sm font-semibold text-slate-900">₹{cashToday.toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cash-counted">Cash Counted (actual)</Label>
                <Input
                  id="cash-counted"
                  type="number"
                  placeholder="Enter amount counted"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(e.target.value)}
                />
              </div>

              {cashCounted !== '' && (
                <div className={`flex justify-between items-center p-3 rounded-lg ${(parseFloat(cashCounted) - cashToday) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <span className="text-sm font-medium">Difference</span>
                  <span className={`text-sm font-bold ${(parseFloat(cashCounted) - cashToday) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {(parseFloat(cashCounted) - cashToday) >= 0 ? '+' : ''}
                    ₹{(parseFloat(cashCounted) - cashToday).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-notes">Notes (optional)</Label>
              <Input
                id="rec-notes"
                placeholder="e.g. Short by 200 due to change given"
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button
              className="w-full"
              onClick={handleSaveReconciliation}
              disabled={reconcileSaving || !cashCounted}
            >
              {reconcileSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Reconciliation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
