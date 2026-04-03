'use client'

import { useItemROI } from '@/lib/queries/useMaintenance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Wrench, 
  AlertTriangle, 
  TrendingDown, 
  History, 
  Trash2,
  CheckCircle2,
  Hammer,
  CreditCard
} from 'lucide-react'
import { formatINR } from '@/lib/format'
import { Button } from '@/components/ui/button'

export function RepairOversight() {
  const { data: roiData, isLoading } = useItemROI()

  const criticalItems = roiData?.filter(item => item.depreciationStatus === 'Critical') || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => <Card key={i} className="h-48 animate-pulse bg-zinc-50" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Critical Alert Section */}
      {criticalItems.length > 0 && (
        <Card className="bg-red-50 border-red-200 border-2 border-dashed shadow-xl shadow-red-50/50">
           <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="h-16 w-16 rounded-3xl bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-200 animate-pulse">
                    <AlertTriangle className="h-8 w-8" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-black italic tracking-tighter text-red-900 uppercase">End-of-Life Alert</h3>
                    <p className="text-xs font-bold text-red-700/60 uppercase tracking-widest leading-loose">
                       {criticalItems.length} items have reached or exceeded 50% of their purchase cost in repairs.
                    </p>
                 </div>
              </div>
              <Button className="bg-red-700 hover:bg-zinc-950 text-white rounded-xl px-8 h-12 shadow-xl border-none font-bold uppercase tracking-widest text-[10px]">
                 Review Retirement List
              </Button>
           </CardContent>
        </Card>
      )}

      {/* Repair Ledger */}
      <Card className="border-zinc-100 shadow-sm bg-white overflow-hidden rounded-3xl">
         <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Maintenance Health</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Asset depreciation vs Operational value</CardDescription>
               </div>
               <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 text-[10px] font-black uppercase tracking-widest bg-zinc-50 border-zinc-200 px-3">
                     Master Ledger
                  </Badge>
               </div>
            </div>
         </CardHeader>
         <CardContent className="p-0">
            <table className="w-full">
               <thead className="bg-zinc-50 border-y border-zinc-100">
                  <tr>
                     <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Inventory Item</th>
                     <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Purchase Basis</th>
                     <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Repair Cost</th>
                     <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Health Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 italic transition-all">
                  {roiData?.map((item) => (
                    <tr key={item.id} className="group hover:bg-zinc-50 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${
                               item.depreciationStatus === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-400'
                             }`}>
                                {item.name[0]}
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-zinc-900 tracking-tight">{item.name}</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{item.category}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 font-mono text-sm font-bold text-zinc-600">
                          {formatINR(item.purchase_cost)}
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                             <span className={`font-mono text-sm font-black ${item.totalRepairCost > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>
                                {formatINR(item.totalRepairCost)}
                             </span>
                             {item.totalRepairCost > 0 && (
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                   {((item.totalRepairCost / item.purchase_cost) * 100).toFixed(1)}% of value
                                </span>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <Badge 
                            variant="outline" 
                            className={`rounded-lg px-4 h-6 uppercase font-black tracking-widest text-[8px] ${
                              item.depreciationStatus === 'Critical' 
                                ? 'bg-red-600 text-white border-none shadow-lg shadow-red-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                             {item.depreciationStatus}
                          </Badge>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </CardContent>
      </Card>
    </div>
  )
}
