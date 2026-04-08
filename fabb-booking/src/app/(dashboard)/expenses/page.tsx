import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Wallet, Search, IndianRupee } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { RecordExpenseDialog } from './RecordExpenseDialog'

const CATEGORY_COLORS: Record<string, string> = {
  rent: 'bg-blue-100 text-blue-700',
  salary: 'bg-purple-100 text-purple-700',
  maintenance: 'bg-amber-100 text-amber-700',
  utilities: 'bg-green-100 text-green-700',
  marketing: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-700',
}

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
  if (!staff) return null

  const { data: expenses, count } = await supabase
    .from('expenses')
    .select('id, description, amount, category, expense_date, created_at', { count: 'exact' })
    .eq('business_id', staff.business_id)
    .order('expense_date', { ascending: false })
    .limit(50)

  const thisMonth = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">{count ?? 0} expense records</p>
        </div>
        <RecordExpenseDialog />
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">This Period</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">₹{thisMonth.toLocaleString('en-IN')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search expenses..." className="pl-10 h-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {expenses && expenses.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                      <p className="text-xs text-slate-500">
                        {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('en-IN') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs capitalize ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other}`}>
                      {expense.category}
                    </Badge>
                    <p className="text-sm font-semibold text-red-600">-₹{Number(expense.amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">No expenses recorded</h3>
              <p className="text-sm text-slate-500 mt-1">Track your business expenses here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
