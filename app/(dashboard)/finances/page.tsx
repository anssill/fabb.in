'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  History, 
  IndianRupee, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  Calculator,
  Download,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  Briefcase
} from 'lucide-react'

// Internal Components
import { CashPositionCard } from '@/components/finances/CashPositionCard'
import { DebtLedger } from '@/components/finances/DebtLedger'

// Reusing Existing Page Logic (Payments & Reconciliation)
// Note: We'll pull the content of the old pages here for consolidation
import PaymentsPage from '../payments/page'
import ReconciliationPage from '../reconciliation/page'

export default function FinancesPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-3 italic">
            <TrendingUp className="h-8 w-8 text-[#ccff00]" />
            FINANCE HUB
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Branch Financial Intelligence & ROI Monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-zinc-200">
            <Download className="h-4 w-4 mr-2" /> Export Audit Trail
          </Button>
          <Button className="bg-zinc-950 text-white rounded-xl shadow-xl shadow-zinc-200 hover:bg-zinc-900 border-none px-6">
            Generate P&L
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashPositionCard />
        </div>
        <Card className="bg-[#ccff00] border-none shadow-xl shadow-zinc-100 flex flex-col justify-center p-8 relative overflow-hidden group">
           <Calculator className="absolute -right-4 -bottom-4 w-32 h-32 text-black opacity-5 group-hover:scale-110 transition-transform duration-700" />
           <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">ROI Efficiency</p>
           <h3 className="text-5xl font-black text-black tracking-tighter italic">92.4%</h3>
           <p className="text-sm font-bold text-black/60 mt-4 leading-snug">
             Your inventory utilization has increased by **8.2%** this month.
           </p>
           <Button className="mt-8 bg-black text-white hover:bg-black/90 rounded-xl w-fit px-8 font-bold text-xs uppercase tracking-widest">
              View Detailed Analytics
           </Button>
        </Card>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <TabsList className="bg-zinc-100/50 p-1 rounded-2xl w-full flex overflow-x-auto hide-scrollbar border border-zinc-200 mb-8 h-12">
          <TabsTrigger value="ledger" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-bold text-xs uppercase tracking-widest">Financial Ledger</TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-bold text-xs uppercase tracking-widest">Shift Closure</TabsTrigger>
          <TabsTrigger value="debt" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-bold text-xs uppercase tracking-widest">Debt Oversight</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-bold text-xs uppercase tracking-widest">Yield Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-6">
          <PaymentsPage />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <ReconciliationPage />
        </TabsContent>

        <TabsContent value="debt" className="space-y-6">
          <DebtLedger />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-zinc-100 shadow-sm p-8 flex flex-col justify-between aspect-video bg-white">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Monthly Revenue Growth</p>
                    <h3 className="text-3xl font-black text-zinc-900">+₹1,42,800</h3>
                  </div>
                  <div className="h-32 w-full bg-zinc-50 rounded-2xl flex items-end p-4 gap-2">
                     {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                       <div key={i} className="flex-1 bg-[#ccff00] rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%` }} />
                     ))}
                  </div>
                </Card>
                <Card className="border-zinc-100 shadow-sm p-8 flex flex-col justify-between aspect-video bg-white">
                   <div className="space-y-2">
                     <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Expense Distribution</p>
                     <h3 className="text-3xl font-black text-zinc-900">₹32,400 <span className="text-sm font-bold text-zinc-400">Fixed Costs</span></h3>
                   </div>
                   <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>Washing & Maintenance</span>
                          <span>64%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-900 w-[64%]" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>Salaries & Rents</span>
                          <span>22%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-900 w-[22%]" />
                        </div>
                      </div>
                   </div>
                </Card>
             </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
