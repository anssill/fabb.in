import { FileChartColumn, IndianRupee, Package, TriangleAlert, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportExportActions } from './ReportExportActions'

export default async function ReportsPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single(); if (!staff?.business_id) return null
  const db = supabase as any
  const [payments, expenses, bookings, customers, unavailable, deposits] = await Promise.all([
    db.from('financial_entries').select('amount, entry_type').eq('business_id', staff.business_id),
    db.from('expenses').select('amount').eq('business_id', staff.business_id),
    db.from('bookings').select('id, total_amount, balance_due, status').eq('business_id', staff.business_id),
    db.from('customers').select('id', { count: 'exact', head: true }).eq('business_id', staff.business_id),
    db.from('inventory_unavailability').select('quantity, restored_quantity').eq('business_id', staff.business_id),
    db.from('deposit_ledger').select('amount, entry_type').eq('business_id', staff.business_id),
  ])
  const revenue = (payments.data ?? []).filter((entry: any) => entry.entry_type === 'payment').reduce((sum: number, entry: any) => sum + Number(entry.amount), 0)
  const expenseTotal = (expenses.data ?? []).reduce((sum: number, entry: any) => sum + Number(entry.amount), 0)
  const receivable = (bookings.data ?? []).filter((entry: any) => !['cancelled', 'closed'].includes(entry.status)).reduce((sum: number, entry: any) => sum + Number(entry.balance_due), 0)
  const blocked = (unavailable.data ?? []).reduce((sum: number, entry: any) => sum + Math.max(0, entry.quantity - entry.restored_quantity), 0)
  const depositLiability = (deposits.data ?? []).reduce((sum: number, entry: any) => sum + (['collection', 'opening', 'transfer'].includes(entry.entry_type) ? Number(entry.amount) : -Number(entry.amount)), 0)
  return <div className="mx-auto max-w-6xl space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-semibold">Reports</h1><p className="text-sm text-muted-foreground">Tenant-wide operational and financial overview. CSV exports open directly in Excel.</p></div><ReportExportActions /></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric icon={IndianRupee} label="Collections" value={`₹${revenue.toLocaleString('en-IN')}`} /><Metric icon={FileChartColumn} label="Net before payroll" value={`₹${(revenue - expenseTotal).toLocaleString('en-IN')}`} /><Metric icon={Users} label="Customers" value={customers.count ?? 0} /><Metric icon={TriangleAlert} label="Blocked units" value={blocked} /></div><div className="grid gap-5 md:grid-cols-3"><Summary title="Receivables" value={`₹${receivable.toLocaleString('en-IN')}`} detail="Open booking balances" /><Summary title="Deposit liability" value={`₹${depositLiability.toLocaleString('en-IN')}`} detail="Held refundable deposits" /><Summary title="Active rentals" value={(bookings.data ?? []).filter((entry: any) => ['hold', 'confirmed', 'picked_up', 'partially_returned'].includes(entry.status)).length} detail="Holds through picked-up" /></div></div>
}
function Metric({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string | number }) { return <Card><CardContent className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><p className="text-lg font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card> }
function Summary({ title, value, detail }: { title: string; value: string | number; detail: string }) { return <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></CardContent></Card> }
