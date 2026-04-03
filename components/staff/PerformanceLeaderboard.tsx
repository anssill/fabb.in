'use client'

import { useStaffPerformance } from '@/lib/queries/useAudit'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  TrendingUp, 
  CheckCircle2, 
  Target, 
  Clock,
  Briefcase,
  Star,
  Loader2
} from 'lucide-react'
import { formatINR } from '@/lib/format'

export function PerformanceLeaderboard() {
  const { data: staff, isLoading } = useStaffPerformance()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-zinc-50 border-zinc-100" />)}
      </div>
    )
  }

  const topPerformer = staff?.[0]

  return (
    <div className="space-y-8">
      {/* Top 3 Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {staff?.slice(0, 3).map((member, i) => (
          <Card key={member.id} className={`border-none shadow-xl relative overflow-hidden group ${
            i === 0 ? 'bg-zinc-950 text-white ring-2 ring-[#ccff00]' : 'bg-white text-zinc-900 border-zinc-100'
          }`}>
             {i === 0 && (
               <Trophy className="absolute -right-4 -bottom-4 h-32 w-32 text-[#ccff00] opacity-10 group-hover:scale-110 transition-transform duration-700" />
             )}
             <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Rank #{i + 1}</span>
                        {i === 0 && <Badge className="bg-[#ccff00] text-black border-none font-black text-[8px] h-4">TOP STAR</Badge>}
                      </div>
                      <h3 className="text-xl font-black italic tracking-tighter">{member.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-50">{member.role}</p>
                   </div>
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${
                     i === 0 ? 'bg-zinc-800 text-[#ccff00]' : 'bg-zinc-100 text-zinc-400'
                   }`}>
                      {member.name[0]}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Bookings Managed</p>
                      <p className="text-2xl font-black">{member.bookingCount}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Branch Revenue</p>
                      <p className="text-xl font-black">{formatINR(member.revenueGenerated)}</p>
                   </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                   <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#ccff00]" style={{ width: `${member.efficiency}%` }} />
                   </div>
                   <span className="text-[10px] font-black">{member.efficiency}%</span>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Rest of the Staff List */}
      {staff && staff.length > 3 && (
        <Card className="border-zinc-100 shadow-sm overflow-hidden bg-white">
           <CardContent className="p-0">
              <table className="w-full">
                 <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                       <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-400">Staff Member</th>
                       <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-400">Efficiency</th>
                       <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-400">Contribution</th>
                       <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-zinc-400">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100">
                    {staff.slice(3).map((member) => (
                       <tr key={member.id} className="group hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                                   {member.name[0]}
                                </div>
                                <span className="text-sm font-bold text-zinc-900">{member.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-bold text-zinc-600">{member.efficiency}% Accuracy</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm font-bold text-zinc-900">
                             {formatINR(member.revenueGenerated)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <Badge variant="outline" className="text-[10px] uppercase font-bold text-zinc-400">
                                On Active Shift
                             </Badge>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </CardContent>
        </Card>
      )}
    </div>
  )
}
