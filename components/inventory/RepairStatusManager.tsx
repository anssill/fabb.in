'use client'

import { useState } from 'react'
import { useCreateRepair, useUpdateRepair } from '@/lib/queries/useItems'
import { useUserStore } from '@/lib/stores/useUserStore'
import { format } from 'date-fns'
import { 
  Wrench, 
  History, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function RepairStatusManager({ item }: { item: any }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newRepair, setNewRepair] = useState({
    vendor_name: '',
    cost: 0,
    sent_date: format(new Date(), 'yyyy-MM-dd'),
    expected_return: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  })

  const createRepair = useCreateRepair()
  const updateRepair = useUpdateRepair()
  const staffId = useUserStore(state => state.profile?.id)

  const handleCreate = async () => {
    await createRepair.mutateAsync({
      item_id: item.id,
      ...newRepair
    })
    setIsAdding(false)
    setNewRepair({
      vendor_name: '',
      cost: 0,
      sent_date: format(new Date(), 'yyyy-MM-dd'),
      expected_return: format(new Date(), 'yyyy-MM-dd'),
      notes: ''
    })
  }

  const handleMarkReturned = async (repairId: string) => {
    await updateRepair.mutateAsync({
      id: repairId,
      updates: {
        status: 'returned',
        actual_return: new Date().toISOString()
      }
    })
  }

  const activeRepair = item.item_repairs?.find((r: any) => r.status === 'out_for_repair' || r.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Active Status Card */}
      <Card className={`border-none shadow-sm ${activeRepair ? 'bg-amber-50/50 ring-1 ring-amber-200' : 'bg-emerald-50/50 ring-1 ring-emerald-200'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${activeRepair ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {activeRepair ? <Truck className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  {activeRepair ? 'Out for Repair' : 'Condition: Good'}
                </h3>
                <p className="text-sm text-zinc-500">
                  {activeRepair ? `Sent to ${activeRepair.vendor_name} on ${format(new Date(activeRepair.sent_date), 'MMM d')}` : 'Ready for rental'}
                </p>
              </div>
            </div>
            {!activeRepair && (
              <Button onClick={() => setIsAdding(true)} className="bg-zinc-950 text-white rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Log Repair
              </Button>
            )}
            {activeRepair && (
              <Button 
                onClick={() => handleMarkReturned(activeRepair.id)} 
                disabled={updateRepair.isPending}
                className="bg-zinc-950 text-white rounded-xl"
              >
                {updateRepair.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                Mark as Returned
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Repair Form */}
      {isAdding && (
        <Card className="border-2 border-zinc-900 shadow-xl animate-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">New Repair Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Vendor Name</label>
                <Input 
                  value={newRepair.vendor_name}
                  onChange={e => setNewRepair({...newRepair, vendor_name: e.target.value})}
                  placeholder="e.g. Master Tailor Ali"
                  className="rounded-xl border-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Repair Cost (₹)</label>
                <Input 
                  type="number"
                  value={newRepair.cost}
                  onChange={e => setNewRepair({...newRepair, cost: Number(e.target.value)})}
                  className="rounded-xl border-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Sent Date</label>
                <Input 
                  type="date"
                  value={newRepair.sent_date}
                  onChange={e => setNewRepair({...newRepair, sent_date: e.target.value})}
                  className="rounded-xl border-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Exp. Return</label>
                <Input 
                  type="date"
                  value={newRepair.expected_return}
                  onChange={e => setNewRepair({...newRepair, expected_return: e.target.value})}
                  className="rounded-xl border-zinc-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Issue Notes</label>
              <Input 
                value={newRepair.notes}
                onChange={e => setNewRepair({...newRepair, notes: e.target.value})}
                placeholder="Describe the damage..."
                className="rounded-xl border-zinc-100"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createRepair.isPending} className="bg-black text-white px-8">
                {createRepair.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm Dispatch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repair History */}
      <div className="space-y-4">
        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <History className="h-4 w-4" />
          Maintenance Log
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {item.item_repairs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((repair: any) => (
            <Card key={repair.id} className="border-zinc-100 shadow-none hover:border-zinc-200 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900">{repair.vendor_name}</span>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider h-4">
                        {repair.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">{repair.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900">₹{repair.cost}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                      {format(new Date(repair.sent_date), 'MMM d')} - {repair.actual_return ? format(new Date(repair.actual_return), 'MMM d') : 'Pending'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!item.item_repairs || item.item_repairs.length === 0) && (
            <div className="py-12 border border-dashed rounded-2xl text-center text-zinc-400 text-sm">
              No historical repairs for this item.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
