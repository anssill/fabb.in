'use client'

import { useState } from 'react'
import { useRepairs, useCreateRepair, useItems } from '@/lib/queries/useItems'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Plus, Wrench, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format, isPast, parseISO } from 'date-fns'

export default function RepairsPage() {
  const { data: repairs = [], isLoading } = useRepairs()
  const { data: items = [] } = useItems()
  const { mutateAsync: createRepair } = useCreateRepair()

  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    item_id: '',
    vendor_name: '',
    cost: '',
    sent_date: '',
    expected_return: '',
    notes: '',
  })

  const handleSubmit = async () => {
    if (!form.item_id || !form.vendor_name || !form.cost) return
    await createRepair({
      item_id: form.item_id,
      vendor_name: form.vendor_name,
      cost: Number(form.cost),
      sent_date: form.sent_date || new Date().toISOString().slice(0, 10),
      expected_return: form.expected_return,
      notes: form.notes,
    })
    setForm({ item_id: '', vendor_name: '', cost: '', sent_date: '', expected_return: '', notes: '' })
    setIsOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="border border-zinc-200">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Repairs</h1>
          <p className="text-zinc-500 mt-1">Track items sent for repair and monitor return dates.</p>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger render={<Button className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold gap-2" />}>
              <Plus className="w-4 h-4" /> Log Repair
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md bg-white">
            <SheetHeader>
              <SheetTitle>Log New Repair</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.item_id}
                  onChange={(e) => setForm({ ...form, item_id: e.target.value })}
                >
                  <option value="">Select item...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name</label>
                <Input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} placeholder="Tailor Khan" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cost (₹)</label>
                  <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sent Date</label>
                  <Input type="date" value={form.sent_date} onChange={(e) => setForm({ ...form, sent_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Return</label>
                <Input type="date" value={form.expected_return} onChange={(e) => setForm({ ...form, expected_return: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Minor tear on sleeve..." />
              </div>
              <Button className="w-full bg-zinc-900 text-white mt-2" onClick={handleSubmit}>
                Submit Repair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-amber-50/50 border-amber-200">
          <p className="text-xs font-bold uppercase text-amber-700 tracking-wider">Sent Out</p>
          <p className="text-2xl font-bold font-mono mt-1 text-amber-800">{repairs.filter((r: any) => r.status === 'sent').length}</p>
        </div>
        <div className="p-4 rounded-xl border bg-red-50/50 border-red-200">
          <p className="text-xs font-bold uppercase text-red-700 tracking-wider">Overdue</p>
          <p className="text-2xl font-bold font-mono mt-1 text-red-800">
            {repairs.filter((r: any) => r.status === 'sent' && r.expected_return && isPast(parseISO(r.expected_return))).length}
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-200">
          <p className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Total Cost</p>
          <p className="text-2xl font-bold font-mono mt-1 text-emerald-800">
            ₹{repairs.reduce((sum: number, r: any) => sum + (r.cost || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow className="border-zinc-200 hover:bg-transparent">
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold">Vendor</TableHead>
              <TableHead className="font-semibold">Cost</TableHead>
              <TableHead className="font-semibold">Sent</TableHead>
              <TableHead className="font-semibold">Expected</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">Loading...</TableCell></TableRow>
            ) : repairs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-400">No repairs logged yet.</TableCell></TableRow>
            ) : (
              repairs.map((r: any) => {
                const overdue = r.status === 'sent' && r.expected_return && isPast(parseISO(r.expected_return))
                return (
                  <TableRow key={r.id} className="border-zinc-200 hover:bg-zinc-50 transition-colors">
                    <TableCell className="font-medium">{r.item?.name || 'Unknown'}</TableCell>
                    <TableCell>{r.vendor_name}</TableCell>
                    <TableCell className="font-mono">₹{r.cost?.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-zinc-500">{r.sent_date ? format(parseISO(r.sent_date), 'dd MMM') : '-'}</TableCell>
                    <TableCell className={overdue ? 'text-red-600 font-semibold' : 'text-zinc-500'}>
                      {r.expected_return ? format(parseISO(r.expected_return), 'dd MMM') : '-'}
                      {overdue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        r.status === 'sent' ? (overdue ? 'bg-red-100 text-red-800 border-0' : 'bg-amber-100 text-amber-800 border-0') :
                        r.status === 'returned' ? 'bg-emerald-100 text-emerald-800 border-0' :
                        'bg-zinc-100 text-zinc-800 border-0'
                      } variant="secondary">
                        {overdue ? 'Overdue' : r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
