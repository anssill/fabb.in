'use client'

import { useItemROI } from '@/lib/queries/useMaintenance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PieChart, 
  Gem, 
  Skull,
  ArrowUpRight,
  Loader2,
  PackageCheck
} from 'lucide-react'
import { formatINR } from '@/lib/format'
import { Button } from '@/components/ui/button'

export function RevenueOptimiser() {
  const { data: roiData, isLoading } = useItemROI()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => <Card key={i} className="h-64 animate-pulse bg-zinc-50 border-none" />)}
      </div>
    )
  }

  const highYield = roiData?.slice(0, 5) || []
  const deadStock = roiData?.filter(item => item.usageCount === 0) || []

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* High Yield Gems */}
        <Card className="border-none bg-zinc-950 text-white shadow-2xl relative overflow-hidden group">
           <Gem className="absolute -right-4 -bottom-4 w-48 h-48 text-[#ccff00] opacity-5 group-hover:scale-110 transition-transform duration-1000" />
           <CardHeader className="p-8">
              <div className="flex items-center justify-between mb-4">
                 <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#ccff00]" />
                 </div>
                 <Badge className="bg-[#ccff00] text-black border-none font-black text-[9px] px-3 h-5">HIGH YIELD</Badge>
              </div>
              <CardTitle className="text-3xl font-black italic tracking-tighter uppercase">Operational Gems</CardTitle>
              <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Highest return on capital investment</CardDescription>
           </CardHeader>
           <CardContent className="p-8 pt-0 space-y-4">
              {highYield.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-none group/item">
                   <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-[#ccff00] opacity-30 italic">{i + 1}</span>
                      <div>
                         <p className="text-sm font-black text-white group-hover/item:text-[#ccff00] transition-colors">{item.name}</p>
                         <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{item.usageCount} Bookings</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black italic text-[#ccff00] tracking-tighter">{item.roi}% ROI</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Net Profit: {formatINR(item.netProfit)}</p>
                   </div>
                </div>
              ))}
           </CardContent>
        </Card>

        {/* Dead Stock / Underutilised */}
        <Card className="border-zinc-100 shadow-xl bg-white relative overflow-hidden group">
           <Skull className="absolute -right-4 -bottom-4 w-48 h-48 text-zinc-50 group-hover:scale-110 transition-transform duration-1000" />
           <CardHeader className="p-8">
              <div className="flex items-center justify-between mb-4">
                 <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                 </div>
                 <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50 font-black text-[9px] px-3 h-5">IDLE ASSETS</Badge>
              </div>
              <CardTitle className="text-3xl font-black italic tracking-tighter uppercase">Dead Stock</CardTitle>
              <CardDescription className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Zero utility items in current period</CardDescription>
           </CardHeader>
           <CardContent className="p-8 pt-0">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                 {deadStock.length > 0 ? deadStock.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-4 border-b border-zinc-50 last:border-none group/item">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-black group-hover/item:bg-red-50 group-hover/item:text-red-500 transition-colors">
                             {item.name[0]}
                          </div>
                          <div>
                             <p className="text-sm font-black text-zinc-900">{item.name}</p>
                             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.category}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-red-600 uppercase tracking-widest italic">Action Required</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Idle for 30+ Days</p>
                       </div>
                    </div>
                 )) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
                       <PackageCheck className="h-12 w-12 text-emerald-500 mb-4" />
                       <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Perfect Utilization</p>
                    </div>
                 )}
              </div>
           </CardContent>
           <div className="p-8 pt-0 mt-auto">
              <Button className="w-full bg-zinc-100 text-zinc-500 hover:bg-zinc-950 hover:text-white rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[10px] border-none transition-all duration-500">
                 View Underutilized Report
              </Button>
           </div>
        </Card>
      </div>
    </div>
  )
}
