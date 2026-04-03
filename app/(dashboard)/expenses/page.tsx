'use client'

import { useState } from 'react'
import { useExpenses, useAddExpense } from '@/lib/queries/useExpenses'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  Receipt, 
  Coffee, 
  Zap, 
  Building2, 
  Wrench, 
  UserCircle 
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses()
  const addExpense = useAddExpense()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form State
  const [newExpense, setNewExpense] = useState({
    category: 'misc',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  })

  const currentMonthExpenses = expenses?.filter(e => 
    isWithinInterval(new Date(e.date), {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    })
  )

  const totalMonthly = currentMonthExpenses?.reduce((acc, e) => acc + Number(e.amount), 0) || 0

  const handleAdd = () => {
    addExpense.mutate({
      ...newExpense,
      amount: Number(newExpense.amount)
    }, {
      onSuccess: () => {
        setIsAddOpen(false)
        setNewExpense({
          category: 'misc',
          amount: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd')
        })
      }
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'rent': return <Building2 className="h-4 w-4 text-orange-500" />
      case 'salary': return <UserCircle className="h-4 w-4 text-indigo-500" />
      case 'utility': return <Zap className="h-4 w-4 text-yellow-500" />
      case 'repair': return <Wrench className="h-4 w-4 text-blue-500" />
      case 'washing': return <TrendingDown className="h-4 w-4 text-emerald-500" />
      default: return <Coffee className="h-4 w-4 text-zinc-400" />
    }
  }

  if (isLoading) return <div className="p-8 space-y-4 pt-20"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Expenses Tracker</h1>
          <p className="text-zinc-500">Manage operational costs and overheads</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Record a new operational cost for this branch.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(val) => setNewExpense({...newExpense, category: val || 'misc'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="washing">External Washing</SelectItem>
                    <SelectItem value="misc">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  className="col-span-3" 
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  className="col-span-3" 
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">Description</Label>
                <Textarea 
                  id="desc" 
                  className="col-span-3" 
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button 
                className="bg-zinc-900 text-white hover:bg-zinc-800" 
                onClick={handleAdd}
                disabled={!newExpense.amount || addExpense.isPending}
              >
                {addExpense.isPending ? 'Saving...' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Summary */}
      <Card className="bg-zinc-50 border-zinc-100 shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Monthly Burn (MTD)</p>
              <h2 className="text-4xl font-bold text-zinc-900">₹{totalMonthly.toLocaleString()}</h2>
            </div>
            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-center text-red-500">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search expenses..." 
              className="pl-10 bg-zinc-50/50 border-zinc-200 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-500">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.filter(e => e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase())).map((expense) => (
                <TableRow key={expense.id} className="group hover:bg-zinc-50 transition-colors">
                  <TableCell className="text-zinc-500 text-xs">
                    {format(new Date(expense.date || new Date().toISOString()), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 capitalize">
                      {getCategoryIcon(expense.category)}
                      {expense.category}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 max-w-xs truncate">
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-zinc-900">
                    ₹{expense.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Receipt className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors cursor-pointer" />
                  </TableCell>
                </TableRow>
              ))}
              {(!expenses || expenses.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-zinc-400">
                    No expenses recorded yet for this branch
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
