import { Banknote } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PayrollPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null
  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single(); if (!staff?.business_id) return null
  const db = supabase as any
  const [{ data: runs = [] }, { data: employees = [] }] = await Promise.all([
    db.from('payroll_runs').select('id, month, status, finalized_at, payroll_entries(net_pay, paid_at)').eq('business_id', staff.business_id).order('month', { ascending: false }),
    db.from('staff').select('id, name, email, status').eq('business_id', staff.business_id).eq('status', 'active'),
  ])
  return <div className="mx-auto max-w-6xl space-y-5"><div><h1 className="text-2xl font-semibold">Payroll</h1><p className="text-sm text-muted-foreground">Monthly salary, attendance-day adjustments, payslips and manual payouts.</p></div><div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4 text-primary" />Payroll runs</CardTitle></CardHeader><CardContent>{runs.length ? <div className="divide-y">{runs.map((run: any) => { const total = (run.payroll_entries ?? []).reduce((sum: number, entry: { net_pay: number }) => sum + Number(entry.net_pay), 0); return <div key={run.id} className="flex items-center justify-between py-4"><div><p className="font-medium">{new Date(run.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p><p className="text-xs text-muted-foreground">{run.payroll_entries?.length ?? 0} employees · ₹{total.toLocaleString('en-IN')}</p></div><Badge variant="outline" className="capitalize">{run.status}</Badge></div> })}</div> : <p className="py-12 text-center text-sm text-muted-foreground">No payroll runs yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Active employees</CardTitle></CardHeader><CardContent><div className="divide-y">{employees.map((employee: any) => <div key={employee.id} className="py-3"><p className="text-sm font-medium">{employee.name || 'Unnamed staff'}</p><p className="text-xs text-muted-foreground">{employee.email}</p></div>)}</div></CardContent></Card></div></div>
}
