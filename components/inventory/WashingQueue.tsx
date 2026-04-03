'use client'

import { useWashingQueue, useUpdateWashingStage } from '@/lib/queries/useMaintenance'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Droplets, 
  Wind, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Package,
  Wrench,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STAGES = [
  { id: 'dirty', name: 'Incoming Dirty', icon: Droplets, color: 'text-red-500 bg-red-50' },
  { id: 'cleaning', name: 'In Process', icon: Loader2, color: 'text-amber-500 bg-amber-50' },
  { id: 'drying', name: 'Drying', icon: Wind, color: 'text-blue-500 bg-blue-50' },
  { id: 'sterile', name: 'Sterile / Ready', icon: Sparkles, color: 'text-emerald-500 bg-emerald-50' }
]

export function WashingQueue() {
  const { data: queue, isLoading } = useWashingQueue()
  const updateStage = useUpdateWashingStage()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-zinc-100 rounded-3xl" />)}
      </div>
    )
  }

  const getStageItems = (stage: string) => queue?.filter(item => item.stage === stage) || []

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-1 py-4">
      {STAGES.map((stage) => {
        const items = getStageItems(stage.id)
        return (
          <div key={stage.id} className="space-y-4">
            <div className={`p-4 rounded-2xl flex items-center justify-between ${stage.color}`}>
               <div className="flex items-center gap-2">
                  <stage.icon className={`h-4 w-4 ${stage.id === 'cleaning' ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{stage.name}</span>
               </div>
               <Badge variant="outline" className="bg-white/50 border-none font-bold text-[10px] rounded-lg">
                  {items.length}
               </Badge>
            </div>

            <div className="space-y-3 min-h-[500px]">
              {items.map((item) => (
                <Card key={item.id} className="border-zinc-100 shadow-sm hover:shadow-md transition-shadow group rounded-2xl">
                   <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <h4 className="text-sm font-bold text-zinc-900 leading-tight">{item.items?.name}</h4>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
                               {item.item_variants?.size} • {item.item_variants?.color}
                            </p>
                         </div>
                         {item.priority === 'express' && (
                           <Badge className="bg-red-500 text-white border-none text-[8px] h-4">PRIORITY</Badge>
                         )}
                      </div>

                      <div className="flex items-center gap-2 py-2 border-y border-zinc-50 border-dashed">
                         <Clock className="h-3 w-3 text-zinc-300" />
                         <span className="text-[10px] font-bold text-zinc-500">
                            Entered {formatDistanceToNow(new Date(item.entered_at))} ago
                         </span>
                      </div>

                      <div className="flex items-center gap-2">
                         {stage.id !== 'sterile' && (
                           <Button 
                             size="sm" 
                             variant="outline"
                             className="w-full text-[10px] font-black uppercase tracking-tighter h-8 rounded-xl border-zinc-200 hover:bg-zinc-950 hover:text-white group"
                             disabled={updateStage.isPending}
                             onClick={() => updateStage.mutate({ 
                               id: item.id, 
                               stage: STAGES[STAGES.findIndex(s => s.id === stage.id) + 1].id 
                             })}
                           >
                              Advance Stage
                              <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                           </Button>
                         )}
                         {stage.id === 'sterile' && (
                           <Button 
                             size="sm" 
                             className="w-full text-[10px] font-black uppercase tracking-tighter h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                             disabled={updateStage.isPending}
                           >
                              Mark In Stock
                              <CheckCircle2 className="h-3 w-3 ml-2" />
                           </Button>
                         )}
                      </div>
                   </CardContent>
                </Card>
              ))}
              {items.length === 0 && (
                <div className="h-32 border-2 border-dashed border-zinc-100 rounded-3xl flex flex-col items-center justify-center space-y-2 opacity-20">
                   <Package className="h-8 w-8 text-zinc-300" />
                   <p className="text-[8px] font-black uppercase tracking-widest">No items here</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
