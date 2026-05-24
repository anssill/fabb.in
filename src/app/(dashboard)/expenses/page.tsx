import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IndianRupee, TrendingDown, TrendingUp } from 'lucide-react'
import { RecordExpenseDialog } from './RecordExpenseDialog'
import { ExpensesClient } from './ExpensesClient'

const CATEGORY_COLORS: Record<string, string> = {
  rent: 'bg-blue-100 text-blue-700',
  salary: 'bg-purple-100 text-purple-700',
  maintenance: 'bg-amber-100 text-amber-700',
  utilities: 'bg-green-100 text-green-700',
  washing: 'bg-cyan-100 text-cyan-700',
  transport: 'bg-orange-100 text-orange-700',
  marketing: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-700',
}

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) return null

  // Current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  // This month's expenses
  const { data: thisMonthExpenses } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
    .gte('expense_date', monthStart)
    .lte('expense_date', monthEnd)

  // Last month's expenses (for comparison)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
  const { data: lastMonthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
    .gte('expense_date', lastMonthStart)
    .lte('expense_date', lastMonthEnd)

  // This month's revenue (from booking_payments)
  const { data: thisMonthPayments } = await supabase
    .from('booking_payments')
    .select('amount, type')
    .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd + 'T23:59:59')
    .eq('is_voided', false)

  // All expenses for list view
  const { data: allExpenses, count } = await supabase
    .from('expenses')
    .select('id, description, amount, category, expense_date, receipt_url, created_at', { count: 'exact' })
    .eq('business_id', staff.business_id).eq('branch_id', staff.branch_id)
    .order('expense_date', { ascending: false })
    .limit(100)

  const thisMonthTotal = (thisMonthExpenses || []).reduce((s, e) => s + Number(e.amount), 0)
  const lastMonthTotal = (lastMonthExpenses || []).reduce((s, e) => s + Number(e.amount), 0)
  const expenseChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  // Revenue excludes refundable deposits. Refunds reduce revenue.
  const thisMonthRevenue = (thisMonthPayments || [])
    .reduce((s, p) => {
      if (p.type === 'refund') return s - Number(p.amount)
      if (['advance', 'balance', 'penalty'].includes(p.type)) return s + Number(p.amount)
      return s
    }, 0)

  const profit = thisMonthRevenue - thisMonthTotal

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {}
  for (const e of thisMonthExpenses || []) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount)
  }
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Expenses</h1>
          <p className="text-sm text-slate-500">{count ?? 0} records total</p>
        </div>
        <RecordExpenseDialog />
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Revenue (This Month)</p>
                <p className="text-xl font-bold text-slate-900">₹{thisMonthRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Expenses (This Month)</p>
                <p className="text-xl font-bold text-slate-900">₹{thisMonthTotal.toLocaleString('en-IN')}</p>
                {lastMonthTotal > 0 && (
                  <p className={`text-xs mt-0.5 ${expenseChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {expenseChange > 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% vs last month
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={profit >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <IndianRupee className={`w-5 h-5 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Net Profit (This Month)</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {profit >= 0 ? '' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Revenue - Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Expense Breakdown — This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map(([category, amount]) => {
                const pct = thisMonthTotal > 0 ? (amount / thisMonthTotal) * 100 : 0
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs capitalize ${CATEGORY_COLORS[category] || CATEGORY_COLORS.other}`}>
                          {category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-400 ml-2">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-[#4f46e5]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List with filtering */}
      <ExpensesClient
        initialExpenses={(allExpenses || []).map(e => ({
          id: e.id,
          description: e.description,
          amount: Number(e.amount),
          category: e.category,
          expense_date: e.expense_date,
          receipt_url: e.receipt_url || null,
          created_at: e.created_at,
        }))}
      />
    </div>
  )
}
