'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users, Phone, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { Skeleton } from '@/components/ui/skeleton'

export default function CustomersPage() {
  const { activeBranch, staff } = useAppStore()
  const [search, setSearch] = useState('')
  const branchId = activeBranch?.id || staff?.branch_id

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', staff?.business_id, branchId],
    enabled: Boolean(staff?.business_id && branchId),
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email, total_bookings, total_spent, outstanding_balance, blacklisted, created_at')
        .eq('business_id', staff!.business_id)
        .eq('branch_id', branchId!)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      return data || []
    },
  })

  // Filter by name or phone client-side
  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    )
  }, [customers, search])

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} customer profiles in this branch</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full px-4 sm:w-auto md:h-10" asChild>
            <Link href="/customers/blacklist">
              <ShieldAlert className="w-4 h-4 mr-2 text-red-500" />
              Blacklist
            </Link>
          </Button>
          <Button className="w-full px-4 sm:w-auto md:h-10" asChild>
            <Link href="/customers/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or phone..."
              className="h-11 pl-10 md:h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
          <CustomersSkeleton />
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
              {filtered.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3 self-stretch sm:self-auto">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-indigo-700">
                        {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900 truncate">{customer.name}</p>
                        {customer.blacklisted && (
                          <Badge variant="destructive" className="text-xs shrink-0">Blacklisted</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        {customer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3 text-right sm:w-auto sm:justify-end sm:gap-6">
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-slate-900">{customer.total_bookings}</p>
                      <p className="text-xs text-slate-500">bookings</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">₹{Number(customer.total_spent).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500">spent</p>
                    </div>
                    {Number(customer.outstanding_balance) > 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs shrink-0">
                        ₹{Number(customer.outstanding_balance).toLocaleString('en-IN')}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">
                {search ? 'No customers match your search' : 'No customers yet'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {search ? 'Try a different name or phone number.' : 'Customers are added during the booking process.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CustomersSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}
