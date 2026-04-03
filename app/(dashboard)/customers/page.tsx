'use client'

import { useState } from 'react'
import { useCustomers, useCreateCustomer } from '@/lib/queries/useCustomers'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Mail, Phone, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const handleCreate = async () => {
    if (!name || !phone) return
    await createCustomer.mutateAsync({ name, phone, email })
    setIsSheetOpen(false)
    setName('')
    setPhone('')
    setEmail('')
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Customers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your client registry and verification scores.</p>
        </div>
        
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger>
            <Button className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold h-10 px-5 rounded-lg shadow-sm transition-transform active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <SheetHeader>
              <SheetTitle>New Customer</SheetTitle>
              <SheetDescription>
                Register a new client for rentals.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarti Sharma" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address (Optional)</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" type="email" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
              </div>
              
              <Button disabled={createCustomer.isPending || !name || !phone} className="w-full mt-6 bg-[#ccff00] text-black font-semibold hover:bg-[#bce600] h-12 rounded-xl" onClick={handleCreate}>
                {createCustomer.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Register Customer
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
          />
        </div>
        <Button variant="outline" className="gap-2 h-10 border-zinc-200 dark:border-zinc-800">
          <Filter className="w-4 h-4 text-zinc-500" /> Filters
        </Button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
            <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
              <TableHead className="font-bold uppercase tracking-widest text-[10px] text-zinc-400 pl-6">Client</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Contact</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Arrears</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Tier</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[10px] text-zinc-400 text-right pr-6">Trust Meter</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={4} className="text-center py-10 text-zinc-500">Loading customers...</TableCell>
               </TableRow>
            ) : customers?.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={4} className="text-center py-10 text-zinc-500">No customers found.</TableCell>
               </TableRow>
            ) : customers?.map((customer) => (
              <TableRow key={customer.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800">
                      <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                        {customer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3 h-3 text-zinc-400" />
                      {customer.phone}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-zinc-400" />
                      {customer.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-bold ${customer.debt_amount > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                    ₹{customer.debt_amount?.toLocaleString() || 0}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-0 font-bold uppercase text-[10px] tracking-wider px-2">
                    {customer.tier}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={
                      (customer.risk_score || 0) <= 25 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black text-[10px] uppercase h-5"
                        : (customer.risk_score || 0) <= 60
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none font-black text-[10px] uppercase h-5"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-black text-[10px] uppercase h-5"
                    } variant="outline">
                      {customer.risk_level || 'Low'} Risk
                    </Badge>
                    <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          (customer.risk_score || 0) <= 25 ? 'bg-green-500' : (customer.risk_score || 0) <= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${customer.risk_score || 5}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
