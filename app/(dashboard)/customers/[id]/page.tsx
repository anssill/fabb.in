'use client'

import { use, useState } from 'react'
import { 
  useCustomer, 
  useCustomerBookings, 
  useRecalculateRiskScore, 
  useUpdateCustomerTier 
} from '@/lib/queries/useCustomers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle,
  Plus,
  Pin,
  Trash2,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Award,
  ShieldAlert,
  History,
  Heart,
  Notebook,
  FileText,
  RefreshCcw,
  Star,
  Users,
  Calendar,
  Loader2
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import Link from 'next/link'
import { RiskMeter } from '@/components/customers/RiskMeter'
import { AadhaarVerification } from '@/components/customers/AadhaarVerification'
import { DebtSettleDialog } from '@/components/customers/DebtSettleDialog'
import { useAddCustomerNote, usePinCustomerNote } from '@/lib/queries/useCustomers'
import { useUserStore } from '@/lib/stores/useUserStore'
import { Input } from '@/components/ui/input'
import { CustomerActivityTimeline } from '@/components/customers/CustomerActivityTimeline'
import { CustomerOutfitHistory } from '@/components/customers/CustomerOutfitHistory'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: customer, isLoading } = useCustomer(id)
  const { data: bookings } = useCustomerBookings(id)
  
  const recalculateRisk = useRecalculateRiskScore()
  const updateTier = useUpdateCustomerTier()
  const addNote = useAddCustomerNote()
  const pinNote = usePinCustomerNote()
  const staffId = useUserStore(state => state.profile?.id)

  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  if (isLoading) return <div className="p-8 space-y-6">
    <Skeleton className="h-20 w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-96" />
  </div>

  if (!customer) return <div className="p-8 text-center">Customer not found</div>

  const riskColor = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700'
  }[customer.risk_level as 'low'|'medium'|'high'] || 'bg-gray-100 text-gray-700'

  const tierColor = {
    bronze: 'bg-orange-100 text-orange-700',
    silver: 'bg-zinc-200 text-zinc-800',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-indigo-100 text-indigo-700'
  }[customer.tier as 'bronze'|'silver'|'gold'|'platinum'] || 'bg-gray-100 text-gray-700'

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-zinc-100">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-zinc-950 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-zinc-200">
              {customer.name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                {customer.name}
                {customer.vip_flag && (
                  <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 px-2 py-0 h-6">
                    <Star className="h-3 w-3 fill-yellow-500" />
                    VIP
                  </Badge>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <Badge variant="outline" className={`${tierColor} border-none font-semibold capitalize`}>
                  <Award className="h-3 w-3 mr-1" />
                  {customer.tier}
                </Badge>
                <Badge variant="outline" className={`${riskColor} border-none font-semibold capitalize`}>
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  {customer.risk_level} Risk
                </Badge>
                <span className="text-zinc-500 flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1 ml-2" />
                  Joined {format(new Date(customer.created_at), 'PPP')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
            <a href={`tel:${customer.phone}`} className="flex items-center hover:text-zinc-950 transition-colors">
              <Phone className="h-4 w-4 mr-2" /> {customer.phone}
            </a>
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center hover:text-zinc-950 transition-colors">
                <Mail className="h-4 w-4 mr-2" /> {customer.email}
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => recalculateRisk.mutate(id)}
            disabled={recalculateRisk.isPending}
            className="hover:bg-zinc-50"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${recalculateRisk.isPending ? 'animate-spin' : ''}`} />
            Recalculate Risk
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updateTier.mutate(id)}
            disabled={updateTier.isPending}
            className="hover:bg-zinc-50"
          >
            <Award className="h-4 w-4 mr-2" />
            Check Tier Eligibility
          </Button>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: `₹${customer.total_spend?.toLocaleString() || 0}`, icon: User, color: 'text-indigo-600' },
          { label: 'Avg Booking', value: `₹${customer.avg_booking_value?.toLocaleString() || 0}`, icon: History, color: 'text-emerald-600' },
          { label: 'Debt Amount', value: `₹${customer.debt_amount?.toLocaleString() || 0}`, icon: AlertCircle, color: customer.debt_amount > 0 ? 'text-red-600' : 'text-zinc-400' },
          { label: 'Loyalty Points', value: customer.loyalty_points || 0, icon: Star, color: 'text-amber-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-[#CCFF00]/10 transition-colors">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              {stat.label === 'Debt Amount' && customer.debt_amount > 0 && (
                <Button 
                  size="sm" 
                  className="w-full mt-4 bg-zinc-950 text-white hover:bg-zinc-800 rounded-xl h-9"
                  onClick={() => setIsDebtDialogOpen(true)}
                >
                  Settle Debt
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <DebtSettleDialog 
        open={isDebtDialogOpen} 
        onOpenChange={setIsDebtDialogOpen}
        customerId={id}
        currentDebt={customer.debt_amount || 0}
        staffId={staffId || ''}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-100/50 p-1 mb-6 border border-zinc-200 w-full flex overflow-x-auto hide-scrollbar">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Activity</TabsTrigger>
          <TabsTrigger value="outfits" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Outfits</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">Bookings</TabsTrigger>
          <TabsTrigger value="family" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">Family Group</TabsTrigger>
          <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">Log</TabsTrigger>
          <TabsTrigger value="docs" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">KYC</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6 max-w-4xl">
          <Card className="border-zinc-100 p-8">
            <CustomerActivityTimeline customerId={id} />
          </Card>
        </TabsContent>

        <TabsContent value="outfits" className="space-y-6">
          <CustomerOutfitHistory customerId={id} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-zinc-100 shadow-sm overflow-hidden border-2 border-emerald-50 bg-emerald-50/5">
              <CardHeader className="bg-emerald-50/30 border-b border-emerald-100 py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800">Trust Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-4">
                <div className="flex flex-col items-center justify-center">
                  <RiskMeter score={customer.risk_score || 0} className="scale-110" />
                  <div className="mt-6 w-full space-y-3">
                    <div className="flex justify-between text-xs font-bold py-2 border-b border-emerald-100/50">
                      <span className="text-zinc-500 uppercase tracking-tighter">Total Bookings</span>
                      <span className="text-emerald-900 font-black">{customer.total_bookings}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold py-2 border-b border-emerald-100/50">
                      <span className="text-zinc-500 uppercase tracking-tighter">Blacklist Status</span>
                      <Badge variant={customer.blacklist_level > 0 ? "destructive" : "secondary"} className={customer.blacklist_level === 0 ? "bg-emerald-100 text-emerald-700 border-none px-2" : ""}>
                        {customer.blacklist_level > 0 ? `Level ${customer.blacklist_level}` : 'TRUSTED'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-[#CCFF00] drop-shadow-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-[#CCFF00] text-[#CCFF00]" />
                  Wishlist Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-xs font-bold uppercase tracking-widest">No active wishlist items</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-zinc-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings?.map((booking) => (
                  <TableRow key={booking.id} className="cursor-pointer hover:bg-zinc-50 transition-colors">
                    <TableCell className="font-mono text-xs text-indigo-600 uppercase">
                      <Link href={`/bookings/${booking.id}`}>
                        {booking.id_display || booking.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {format(new Date(booking.pickup_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px] h-5">
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{booking.total_amount}</TableCell>
                    <TableCell className={`text-right font-semibold ${booking.balance_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{booking.balance_due}
                    </TableCell>
                  </TableRow>
                ))}
                {(!bookings || bookings.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                      No bookings found for this customer
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="family">
          <Card className="border-zinc-100 p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-zinc-200 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-1">Family Pooling</h3>
            <p className="text-zinc-500 mb-6">Link this customer to a family group to pool loyalty points.</p>
            <Button variant="outline">Create a Family Group</Button>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-zinc-500">
                <Notebook className="h-4 w-4 text-zinc-400" />
                Staff Internal Log
              </h2>
              <Button size="sm" variant="outline" className="h-8 rounded-lg border-zinc-200" onClick={() => setIsAddingNote(!isAddingNote)}>
                {isAddingNote ? 'Cancel' : <><Plus className="h-3.5 w-3.5 mr-1" /> New Note</>}
              </Button>
            </div>

            {isAddingNote && (
              <Card className="border shadow-lg shadow-zinc-100 overflow-hidden animate-in slide-in-from-top-4">
                <CardContent className="p-0">
                  <Input 
                    placeholder="Enter staff note... e.g. Always check measurements for this client" 
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="border-none h-14 px-6 rounded-none focus-visible:ring-0 text-sm"
                  />
                  <div className="px-4 py-3 bg-zinc-50 border-t flex justify-end">
                    <Button 
                      size="sm" 
                      className="bg-black text-white hover:bg-zinc-800 h-8 font-bold"
                      disabled={!newNoteContent.trim() || addNote.isPending}
                      onClick={async () => {
                        await addNote.mutateAsync({ customerId: id, content: newNoteContent, staffId })
                        setNewNoteContent('')
                        setIsAddingNote(false)
                      }}
                    >
                      {addNote.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                      Save Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {customer.notes?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {customer.notes.sort((a: any, b: any) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map((note: any) => (
                  <Card key={note.id} className={`border-zinc-100 shadow-none relative transition-all ${note.is_pinned ? 'bg-amber-50/30 border-amber-200 border-2' : 'bg-white'}`}>
                    <CardContent className="py-4 flex gap-4">
                      <div className="p-2 bg-white rounded-xl h-fit border border-zinc-100 shadow-sm">
                        <Notebook className={`h-4 w-4 ${note.is_pinned ? 'text-amber-600' : 'text-zinc-400'}`} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="text-zinc-800 text-sm font-medium leading-relaxed">{note.content}</p>
                        <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                          <span>By: {note.staff_id || 'System'}</span>
                          <span>{format(new Date(note.created_at), 'PPP')}</span>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className={`h-8 w-8 rounded-lg ${note.is_pinned ? 'text-amber-600 hover:bg-amber-100' : 'text-zinc-300 hover:bg-zinc-100'}`}
                        onClick={() => pinNote.mutate({ noteId: note.id, isPinned: !note.is_pinned, customerId: id })}
                      >
                        <Pin className="h-4 w-4" fill={note.is_pinned ? "currentColor" : "none"} />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-zinc-200 bg-zinc-50/50 shadow-none py-12 text-center">
                <Notebook className="h-10 w-10 mx-auto text-zinc-200 mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">No staff notes logged</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <div className="pb-20">
            <AadhaarVerification 
              customerId={id} 
              frontUrl={customer.aadhaar_front_url} 
              backUrl={customer.aadhaar_back_url} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
