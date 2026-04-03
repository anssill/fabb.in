'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuditTrailTable } from '@/components/audit/AuditTrailTable'
import { PerformanceLeaderboard } from '@/components/staff/PerformanceLeaderboard'
import { 
  ShieldAlert, 
  History, 
  BarChart3, 
  Search, 
  Download, 
  Settings, 
  PlusCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AuditPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-3 italic">
            <ShieldAlert className="h-8 w-8 text-[#ccff00]" />
            CONTROL CENTER
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Branch Integrity & Staff Accountability Systems</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-zinc-200">
            <Download className="h-4 w-4 mr-2" /> Export Audit Archive
          </Button>
          <Button className="bg-zinc-950 text-white rounded-xl shadow-xl shadow-zinc-200 hover:bg-zinc-900 border-none px-6">
            Force Re-Sync Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 text-white border-none p-8 flex flex-col justify-center relative overflow-hidden group">
           <History className="absolute -right-4 -bottom-4 w-32 h-32 text-[#ccff00] opacity-5 group-hover:scale-110 transition-transform duration-700" />
           <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Active Sessions</p>
           <h3 className="text-4xl font-black tracking-tighter text-white italic">14 Staff</h3>
           <p className="text-sm font-medium text-zinc-400 mt-4 leading-snug">
              **3 branches** actively synchronizing events with the master ledger.
           </p>
        </Card>
        <Card className="bg-[#ccff00] border-none p-8 flex flex-col justify-center relative shadow-xl shadow-[#ccff00]/10 group">
           <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-black opacity-5 group-hover:scale-110 transition-transform duration-700" />
           <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">High-Risk Events</p>
           <h3 className="text-4xl font-black tracking-tighter text-black italic">0 Flagged</h3>
           <p className="text-sm font-bold text-black/60 mt-4 leading-snug">
              No unauthorized status changes or payment overrides detected in the last **24 hours**.
           </p>
        </Card>
        <Card className="bg-white border-zinc-100 p-8 flex flex-col justify-center shadow-lg relative group">
           <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-zinc-100 group-hover:scale-110 transition-transform duration-700" />
           <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">System Health</p>
           <h3 className="text-4xl font-black tracking-tighter text-zinc-900 italic">99.9%</h3>
           <p className="text-sm font-medium text-zinc-500 mt-4 leading-snug">
              Inventory and booking data layers are fully optimized.
           </p>
        </Card>
      </div>

      <Tabs defaultValue="stream" className="w-full">
        <TabsList className="bg-zinc-100/50 p-1 rounded-2xl w-full flex overflow-x-auto hide-scrollbar border border-zinc-200 mb-8 h-12">
          <TabsTrigger value="stream" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-bold text-xs uppercase tracking-widest gap-2">
             <History className="h-3 w-3" /> System Audit Stream
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-bold text-xs uppercase tracking-widest gap-2">
             <BarChart3 className="h-3 w-3" /> Staff Leaderboard
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-bold text-xs uppercase tracking-widest gap-2">
             <Settings className="h-3 w-3" /> Audit Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="space-y-6">
           <AuditTrailTable />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
           <PerformanceLeaderboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
           <Card className="border-dashed border-2 border-zinc-200 bg-zinc-50/50 rounded-3xl">
              <CardContent className="h-96 flex flex-col items-center justify-center p-12 text-center">
                 <Settings className="h-12 w-12 text-zinc-300 mb-4 animate-spin-slow" />
                 <p className="text-lg font-black italic tracking-tighter text-zinc-400">AUDIT LOG CONFIGURATION</p>
                 <p className="text-sm font-bold text-zinc-400 max-w-sm mt-2 opacity-50 uppercase tracking-widest leading-loose">
                    Configure webhooks for high-risk system overrides, status lockdowns, and immutable ledger exports.
                 </p>
                 <Button variant="outline" className="mt-8 rounded-xl px-12 border-zinc-300">Open Config Editor</Button>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
