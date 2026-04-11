'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users, Phone, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchCustomers() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staff } = await supabase
        .from('staff')
        .select('business_id')
        .eq('id', user.id)
        .single()
      if (!staff) return

      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, email, total_bookings, total_spent, outstanding_balance, blacklisted, created_at')
        .eq('business_id', staff.business_id)
        .order('created_at', { ascending: false })
        .limit(200)

      setCustomers(data || [])
      setLoading(false)
    }
    fetchCustomers()
  }, [])

  // Filter by name or phone client-side
  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    )
  }, [customers, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers/blacklist">
              <ShieldAlert className="w-4 h-4 mr-2 text-red-500" />
              Blacklist
            </Link>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
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
              className="pl-10 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading customers...</div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filtered.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-violet-700">
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
                  <div className="flex items-center gap-3 sm:gap-6 text-right shrink-0">
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
