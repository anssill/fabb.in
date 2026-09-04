'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { IndianRupee, Search, Trash2, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const CATEGORY_COLORS: Record<string, string> = {
  rent: 'bg-blue-100 text-blue-700',
  salary: 'bg-purple-100 text-purple-700',
  maintenance: 'bg-amber-100 text-amber-700',
  utilities: 'bg-green-100 text-green-700',
  transport: 'bg-orange-100 text-orange-700',
  marketing: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-700',
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  expense_date: string
  receipt_url: string | null
  created_at: string
}

interface Props {
  initialExpenses: Expense[]
}

export function ExpensesClient({ initialExpenses }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = initialExpenses.filter((e) => {
    const matchesSearch = !search || e.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense? This cannot be undone.')) return
    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      toast.success('Expense deleted')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="salary">Salary</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{expense.description}</p>
                    <p className="text-xs text-slate-500">
                      {expense.expense_date
                        ? new Date(expense.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={`text-xs capitalize hidden sm:inline-flex ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other}`}>
                    {expense.category}
                  </Badge>
                  <p className="text-sm font-semibold text-red-600">-₹{expense.amount.toLocaleString('en-IN')}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                    onClick={() => handleDelete(expense.id)}
                    disabled={deleting === expense.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wallet className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 text-sm">
              {search || categoryFilter !== 'all' ? 'No expenses match your filters' : 'No expenses recorded yet'}
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-sm font-semibold text-slate-900">
              Total: ₹{filtered.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
