'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePayments, useVoidPayment } from '@/lib/queries/usePayments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Ban, 
  Receipt,
  CreditCard,
  Wallet,
  Landmark,
  Banknote,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function PaymentsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/finances')
  }, [router])

  const { data: payments, isLoading } = usePayments()
  const [searchTerm, setSearchTerm] = useState('')
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [voidReason, setVoidReason] = useState('')

  const voidPayment = useVoidPayment()

  const filteredPayments = payments?.filter(p => 
    p.bookings?.booking_id_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleVoid = () => {
    if (!selectedPayment || !voidReason) return
    voidPayment.mutate({ paymentId: selectedPayment.id, reason: voidReason }, {
      onSuccess: () => {
        setVoidDialogOpen(false)
        setVoidReason('')
        setSelectedPayment(null)
      }
    })
  }

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'upi': return <ArrowUpRight className="h-4 w-4 text-indigo-500" />
      case 'card': return <CreditCard className="h-4 w-4 text-blue-500" />
      case 'cash': return <Banknote className="h-4 w-4 text-emerald-500" />
      case 'bank': return <Landmark className="h-4 w-4 text-zinc-500" />
      case 'store_credit': return <Wallet className="h-4 w-4 text-amber-500" />
      default: return <Receipt className="h-4 w-4 text-zinc-400" />
    }
  }

  if (isLoading) return <div className="p-8 space-y-4">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-96 w-full" />
  </div>

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Financial Ledger</h1>
          <p className="text-zinc-500">Track and manage all branch transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800">
            Record Direct Payment
          </Button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-950 text-white border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Total Revenue (MTD)</p>
            <h2 className="text-2xl font-bold">₹{payments?.reduce((acc, p) => p.is_voided ? acc : acc + p.amount, 0).toLocaleString()}</h2>
          </CardContent>
        </Card>
        <Card className="border-zinc-100 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Cash on Hand</p>
            <h2 className="text-2xl font-bold text-zinc-900">₹{payments?.filter(p => p.method === 'cash' && !p.is_voided).reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</h2>
          </CardContent>
        </Card>
        <Card className="border-zinc-100 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">UPI Transactions</p>
            <h2 className="text-2xl font-bold text-zinc-900">₹{payments?.filter(p => p.method === 'upi' && !p.is_voided).reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</h2>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search by Booking ID or Method..." 
              className="pl-10 bg-zinc-50/50 border-zinc-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-zinc-500">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments?.map((payment) => (
                <TableRow key={payment.id} className={`${payment.is_voided ? 'opacity-50' : ''}`}>
                  <TableCell className="text-xs text-zinc-500">
                    {format(new Date(payment.timestamp), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-indigo-600 uppercase">
                    {payment.bookings?.booking_id_display || payment.booking_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px] bg-zinc-50 border-zinc-200">
                      {payment.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 capitalize">
                      {getMethodIcon(payment.method)}
                      {payment.method.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-zinc-900">
                    ₹{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {payment.is_voided ? (
                      <Badge variant="destructive" className="h-5 text-[10px]">Voided</Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">Settled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!payment.is_voided && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
                            setSelectedPayment(payment);
                            setVoidDialogOpen(true);
                          }}>
                            <Ban className="h-4 w-4 mr-2" /> Void Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredPayments || filteredPayments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-zinc-400">
                    No transactions recorded matching your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Void Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Void Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to void this payment of ₹{selectedPayment?.amount}? This action cannot be undone and will revert the balance on the booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Voiding</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g. Wrong entry, payment failed, refund processed"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleVoid} disabled={!voidReason || voidPayment.isPending}>
              {voidPayment.isPending ? 'Processing...' : 'Confirm Void'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
