'use client'

import { useState } from 'react'
import { useSystemAuditLog } from '@/lib/queries/useAudit'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Clock, 
  User, 
  FileText, 
  Wrench, 
  AlertCircle,
  Receipt,
  Package,
  History,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'

export function AuditTrailTable() {
  const { data: logs, isLoading } = useSystemAuditLog()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs?.filter(l => 
    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.staff?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.id?.slice(0, 8).includes(searchTerm)
  )

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'repair': return <Wrench className="h-4 w-4 text-amber-500" />
      case 'booking': return <Receipt className="h-4 w-4 text-emerald-500" />
      default: return <FileText className="h-4 w-4 text-zinc-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Card key={i} className="h-16 animate-pulse bg-zinc-50 border-zinc-100" />)}
      </div>
    )
  }

  return (
    <Card className="border-zinc-100 shadow-sm overflow-hidden bg-white">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search audit trail by action, staff, or ID..." 
            className="pl-10 bg-white border-zinc-200 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
           <History className="h-3 w-3" />
           Live System Stream
        </div>
      </div>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Staff/User</TableHead>
              <TableHead>Action/Change</TableHead>
              <TableHead className="text-right">Reference ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs?.map((log, i) => (
              <TableRow key={i} className="group hover:bg-zinc-50 transition-colors">
                <TableCell className="text-xs font-medium text-zinc-500">
                   <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 opacity-30" />
                      {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                      {getLogIcon(log.type)}
                      <Badge variant="outline" className="capitalize text-[9px] font-black tracking-tighter h-5 border-zinc-200">
                         {log.type}
                      </Badge>
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                         {log.staff?.name?.[0] || 'S'}
                      </div>
                      <span className="text-sm font-bold text-zinc-900">{log.staff?.name || 'System Auto'}</span>
                   </div>
                </TableCell>
                <TableCell>
                   <p className="text-sm text-zinc-700 font-medium">{log.action || log.notes || 'Status Updated'}</p>
                   {log.items?.name && (
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Item: {log.items.name}</p>
                   )}
                </TableCell>
                <TableCell className="text-right">
                   <code className="text-[10px] bg-zinc-100 px-2 py-1 rounded-md font-mono text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all uppercase tracking-tighter">
                      #{log.id?.slice(0, 8) || 'AUTO-88'}
                   </code>
                </TableCell>
              </TableRow>
            ))}
            {(!filteredLogs || filteredLogs.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                      <AlertCircle className="h-12 w-12 text-zinc-400" />
                      <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">No matching logs found in this period</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
