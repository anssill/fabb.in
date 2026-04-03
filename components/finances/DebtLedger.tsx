'use client'

import { useState } from 'react'
import { useDebtLedger } from '@/lib/queries/useFinances'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  IndianRupee,
  MoreVertical,
  History,
  ShieldAlert,
  Loader2
} from 'lucide-react'
import { formatINR } from '@/lib/format'
import { DebtSettleDialog } from '@/components/customers/DebtSettleDialog'
import { useUserStore } from '@/lib/stores/useUserStore'

export function DebtLedger() {
  const { data: debtors, isLoading } = useDebtLedger()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const staffId = useUserStore(state => state.profile?.id)

  const filtered = debtors?.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm)
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Card key={i} className="h-20 animate-pulse bg-zinc-50" />)}
      </div>
    )
  }

  return (
    <Card className="border-zinc-100 shadow-sm overflow-hidden bg-white">
      <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search debtors by name or phone..." 
            className="pl-10 bg-white border-zinc-200 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Active Collection
          </div>
          <span>Total: {debtors?.length || 0} Clients</span>
        </div>
      </div>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Loyalty Tier</TableHead>
              <TableHead className="text-right">Unsettled Balance</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered?.map((debtor) => (
              <TableRow key={debtor.id} className="hover:bg-zinc-50 transition-colors group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-zinc-950 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-zinc-200">
                      {debtor.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 leading-tight">{debtor.name}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                         Spend: {formatINR(debtor.total_spend || 0)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-600 font-medium text-sm">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-zinc-400" />
                    {debtor.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize text-[9px] font-black h-5 border-none ${
                    debtor.tier === 'platinum' ? 'bg-indigo-100 text-indigo-700' :
                    debtor.tier === 'gold' ? 'bg-amber-100 text-amber-700' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    {debtor.tier}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-lg font-black text-red-600 leading-tight">
                    {formatINR(debtor.debt_amount)}
                  </p>
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">
                    Immediate Settlement Needed
                  </p>
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    className="bg-zinc-900 text-white rounded-xl h-9 px-4 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setSelectedDebtor(debtor)
                      setIsDialogOpen(true)
                    }}
                  >
                    Settle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!filtered || filtered.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                      <ShieldAlert className="h-12 w-12 text-zinc-400" />
                      <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">No Outstanding Debts Found</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {selectedDebtor && (
        <DebtSettleDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          customerId={selectedDebtor.id}
          currentDebt={selectedDebtor.debt_amount}
          staffId={staffId || ''}
        />
      )}
    </Card>
  )
}
