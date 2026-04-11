'use client'

import { useState } from 'react'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import type { BookingCustomer } from '../page'

interface Props {
  customer: BookingCustomer
  setCustomer: (c: BookingCustomer) => void
}

export function CustomerStep({ customer, setCustomer }: Props) {
  const { staff } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookingCustomer[]>([])
  const [isNew, setIsNew] = useState(false)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 3 || !staff?.business_id) return
    setSearching(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, email, address, id_type, id_number, blacklisted, total_bookings')
        .eq('business_id', staff.business_id)
        .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(5)

      setSearchResults(data || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const selectCustomer = (c: BookingCustomer) => {
    setCustomer(c)
    setIsNew(false)
    setSearchResults([])
  }

  const startNew = () => {
    setIsNew(true)
    setCustomer({ name: '', phone: searchQuery.match(/\d{10}/) ? searchQuery : '' })
    setSearchResults([])
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Customer Details
        </CardTitle>
        <CardDescription>Search for an existing customer or add a new one</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        {!customer.id && !isNew && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or phone number..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" onClick={handleSearch} disabled={searching || searchQuery.length < 3}>
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.phone} {c.email ? `· ${c.email}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(c as unknown as { blacklisted?: boolean }).blacklisted && <Badge variant="destructive" className="text-xs">Blacklisted</Badge>}
                      <span className="text-xs text-slate-400">{(c as unknown as { total_bookings?: number }).total_bookings || 0} bookings</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.length >= 3 && !searching && (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">No customers found</p>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={startNew}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Customer
            </Button>
          </>
        )}

        {/* Selected or New Customer Form */}
        {(customer.id || isNew) && (
          <div className="space-y-4">
            {customer.id && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">{customer.name}</p>
                  <p className="text-xs text-blue-600">{customer.phone}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setCustomer({ name: '', phone: '' }); setIsNew(false) }}>
                  Change
                </Button>
              </div>
            )}

            {isNew && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full name *</Label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="e.g. Arun Kumar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone number *</Label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email <span className="text-slate-400">(optional)</span></Label>
                    <Input
                      value={customer.email || ''}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      type="email"
                      placeholder="arun@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID type <span className="text-slate-400">(optional)</span></Label>
                    <Input
                      value={customer.id_type || ''}
                      onChange={(e) => setCustomer({ ...customer, id_type: e.target.value })}
                      placeholder="Aadhaar, PAN, etc."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID number <span className="text-slate-400">(optional)</span></Label>
                    <Input
                      value={customer.id_number || ''}
                      onChange={(e) => setCustomer({ ...customer, id_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address <span className="text-slate-400">(optional)</span></Label>
                    <Input
                      value={customer.address || ''}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </>
  )
}
