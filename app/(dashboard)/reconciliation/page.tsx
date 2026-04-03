'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useReconciliation, useAddReconciliation, useTodaysCashSummary } from '@/lib/queries/useReconciliation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR } from '@/lib/format'
import { 
  IndianRupee, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft,
  Briefcase
} from 'lucide-react'
import { toast } from 'sonner'

export default function ReconciliationPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/finances')
  }, [router])
  
  const profile = useUserStore((s) => s.profile)
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  
  const { data: history, isLoading: historyLoading } = useReconciliation()
  const { data: summary, isLoading: summaryLoading } = useTodaysCashSummary()
  const addMutation = useAddReconciliation()

  const [actualAmount, setActualAmount] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const expected = summary?.totalRevenue ? (summary.totalRevenue - (summary.totalExpenses || 0)) : 0
  const difference = actualAmount ? Number(actualAmount) - expected : 0

  const handleSubmit = async () => {
    if (!actualAmount || isNaN(Number(actualAmount))) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!profile?.id) return

    try {
      await addMutation.mutateAsync({
        date: new Date().toISOString().split('T')[0],
        expected_amount: expected,
        actual_amount: Number(actualAmount),
        difference: difference,
        notes: notes,
        approved_by: profile.id
      })
      toast.success('Shift closure recorded successfully')
      setActualAmount('')
      setNotes('')
    } catch (err) {
      toast.error('Failed to save reconciliation')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Financial Reconciliation</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Close your daily shift by verifying the physical cash in drawer.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Stats */}
        <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-[#ccff00]" />
              Today's Cash Position
            </CardTitle>
            <CardDescription>Estimated cash currently in the drawer based on system recordings.</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500 font-medium uppercase mb-1">Cash Inflow</p>
                    <p className="text-xl font-bold text-emerald-600">+{formatINR(summary?.totalRevenue || 0)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500 font-medium uppercase mb-1">Cash Outflow</p>
                    <p className="text-xl font-bold text-red-600">-{formatINR(summary?.totalExpenses || 0)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold uppercase mb-1">Expected Balance</p>
                    <p className="text-xl font-bold text-black dark:text-white">{formatINR(expected)}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actual">Actual Cash Handled</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-400">₹</span>
                        <Input 
                          id="actual"
                          placeholder="0.00" 
                          className="pl-7 h-11 text-lg font-semibold"
                          value={actualAmount}
                          onChange={(e) => setActualAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Difference</Label>
                      <div className={`h-11 flex items-center px-4 rounded-md border ${
                        difference === 0 ? 'bg-zinc-50 border-zinc-200' : 
                        difference > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                        'bg-red-50 border-red-200 text-red-700'
                      } font-bold`}>
                        {difference > 0 ? '+' : ''}{formatINR(difference)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Observations</Label>
                    <Input 
                      id="notes" 
                      placeholder="e.g. Returned ₹100 extra as change by mistake..." 
                      className="h-11"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button 
                    className="w-full h-12 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold text-lg"
                    onClick={handleSubmit}
                    disabled={addMutation.isPending}
                  >
                    {addMutation.isPending ? 'Saving...' : 'Confirm & Close Shift'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guidance */}
        <Card className="bg-zinc-900 text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#ccff00]" />
              Audit Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-400">
            <p>1. Count all physical cash bills and coins.</p>
            <p>2. Deduct any petty cash used for direct expenses (ensure receipts are uploaded).</p>
            <p>3. If the difference is &gt; ₹500, a manager approval is required.</p>
            <div className="pt-4 mt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-[#ccff00] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Shift Lead: {profile?.name || 'Loading...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-400" />
              Reconciliation History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : !history?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-zinc-400">
                    No reconciliation history found for this branch.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</TableCell>
                    <TableCell>{formatINR(row.expected_amount)}</TableCell>
                    <TableCell className="font-bold">{formatINR(row.actual_amount)}</TableCell>
                    <TableCell>
                      <span className={row.difference === 0 ? 'text-zinc-500' : row.difference > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {row.difference > 0 ? '+' : ''}{formatINR(row.difference)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{row.staff?.name}</span>
                        <span className="text-[10px] uppercase text-zinc-500">{row.staff?.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.difference === 0 ? 'default' : 'outline'} className="text-[10px]">
                        {row.difference === 0 ? 'Balanced' : 'Flagged'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
