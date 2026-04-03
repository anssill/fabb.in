'use client'

import { useDailyYield } from '@/lib/queries/useFinances'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Banknote, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info,
  TrendingDown,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { formatINR } from '@/lib/format'

export function CashPositionCard() {
  const { data: yieldData, isLoading } = useDailyYield()

  if (isLoading) {
    return (
      <Card className="border-zinc-100 shadow-sm animate-pulse">
        <CardContent className="h-32 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
        </CardContent>
      </Card>
    )
  }

  const isNetPositive = (yieldData?.netYield || 0) >= 0

  return (
    <Card className="border-none bg-zinc-950 text-white shadow-xl shadow-zinc-200 overflow-hidden relative group">
      {/* Background Accent */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#ccff00]/10 blur-3xl group-hover:bg-[#ccff00]/20 transition-all duration-700" />
      
      <CardContent className="pt-8 pb-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Total System Revenue (Today)</p>
            <h2 className="text-4xl font-black text-white tracking-tight">
              {formatINR(yieldData?.totalRevenue || 0)}
            </h2>
          </div>
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
            <Banknote className="h-6 w-6 text-[#ccff00]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-zinc-800/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Cash Inflow
            </div>
            <p className="text-xl font-bold text-zinc-100">{formatINR(yieldData?.cashInflow || 0)}</p>
          </div>
          <div className="space-y-1 border-l border-zinc-800/50 pl-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Op. Expenses
            </div>
            <p className="text-xl font-bold text-zinc-100">{formatINR(yieldData?.totalExpenses || 0)}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isNetPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Estimated Net Yield</p>
              <p className="text-sm font-bold text-zinc-200">
                {isNetPositive ? '+' : '-'}{formatINR(Math.abs(yieldData?.netYield || 0))}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isNetPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {isNetPositive ? 'HEALTHY' : 'DEFICIT'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
