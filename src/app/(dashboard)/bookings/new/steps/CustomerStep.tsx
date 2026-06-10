import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, User, Loader2, Phone, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from '../../../inventory/components/ImageUpload'
import type { BookingCustomer } from '../page'

interface Props {
  customer: BookingCustomer
  setCustomer: (c: BookingCustomer) => void
}

export function CustomerStep({ customer, setCustomer }: Props) {
  const { staff, activeBranch } = useAppStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [showExtraPhones, setShowExtraPhones] = useState(false)
  const branchId = activeBranch?.id || staff?.branch_id
  const trimmedSearch = searchQuery.trim()
  const customerSelect = 'id, name, phone, alternate_phone, emergency_phone, email, address, id_type, id_number, id_proof_url, blacklisted, total_bookings, created_at'

  const hydrateBookingCounts = async (customers: BookingCustomer[]) => {
    const supabase = createClient()
    const uniqueCustomers = Array.from(
      new Map(customers.filter((c) => c.id).map((c) => [c.id!, c])).values()
    )

    const counts = await Promise.all(
      uniqueCustomers.map(async (c) => {
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', staff!.business_id)
          .eq('branch_id', branchId!)
          .eq('customer_id', c.id!)

        return [c.id!, count ?? c.total_bookings ?? 0] as const
      })
    )

    const countMap = new Map(counts)
    return customers.map((c) => ({
      ...c,
      total_bookings: c.id ? countMap.get(c.id) ?? c.total_bookings ?? 0 : c.total_bookings ?? 0,
    }))
  }

  useEffect(() => {
    if (!staff?.business_id || !branchId) return

    const supabase = createClient()
    const invalidateCustomers = () => {
      void queryClient.invalidateQueries({ queryKey: ['booking-recent-customers', staff.business_id, branchId] })
      void queryClient.invalidateQueries({ queryKey: ['booking-customer-search', staff.business_id, branchId] })
    }

    const channel = supabase
      .channel(`booking-customer-live-${staff.business_id}-${branchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `branch_id=eq.${branchId}` }, invalidateCustomers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `branch_id=eq.${branchId}` }, invalidateCustomers)
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [branchId, queryClient, staff?.business_id])

  const { data: recentCustomers = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['booking-recent-customers', staff?.business_id, branchId],
    enabled: Boolean(staff?.business_id && branchId && !trimmedSearch),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select(`created_at, customer:customers(${customerSelect})`)
        .eq('business_id', staff!.business_id)
        .eq('branch_id', branchId!)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const latestCustomers = new Map<string, BookingCustomer>()
      ;(data || []).forEach((row: any) => {
        const c = Array.isArray(row.customer) ? row.customer[0] : row.customer
        if (!c?.id || latestCustomers.has(c.id)) return
        latestCustomers.set(c.id, { ...c, latest_booking_at: row.created_at })
      })

      if (latestCustomers.size < 5) {
        const { data: fallbackCustomers, error: fallbackError } = await supabase
          .from('customers')
          .select(customerSelect)
          .eq('business_id', staff!.business_id)
          .eq('branch_id', branchId!)
          .order('created_at', { ascending: false })
          .limit(5)

        if (fallbackError) throw fallbackError
        ;(fallbackCustomers || []).forEach((c: any) => {
          if (!latestCustomers.has(c.id)) latestCustomers.set(c.id, c)
        })
      }

      return hydrateBookingCounts(Array.from(latestCustomers.values()).slice(0, 5))
    },
  })

  const { data: searchResults = [], isFetching: searching, refetch: refetchSearch } = useQuery({
    queryKey: ['booking-customer-search', staff?.business_id, branchId, trimmedSearch],
    enabled: Boolean(staff?.business_id && branchId && trimmedSearch),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select(customerSelect)
        .eq('business_id', staff!.business_id)
        .eq('branch_id', branchId!)
        .or(`name.ilike.%${trimmedSearch}%,phone.ilike.%${trimmedSearch}%,alternate_phone.ilike.%${trimmedSearch}%,emergency_phone.ilike.%${trimmedSearch}%,email.ilike.%${trimmedSearch}%`)
        .order('name', { ascending: true })
        .limit(5)

      if (error) throw error
      return hydrateBookingCounts((data || []) as BookingCustomer[])
    },
  })

  const selectedPhones = useMemo(() => [
    { label: 'Primary', value: customer.phone },
    { label: 'Alternate', value: customer.alternate_phone },
    { label: 'Safety', value: customer.emergency_phone },
  ].filter((phone) => phone.value), [customer.phone, customer.alternate_phone, customer.emergency_phone])

  const selectCustomer = (c: BookingCustomer) => {
    setCustomer(c)
    setIsNew(false)
    setShowExtraPhones(Boolean(c.alternate_phone || c.emergency_phone))
  }

  const startNew = () => {
    setIsNew(true)
    setCustomer({ name: '', phone: searchQuery.match(/\d{10}/) ? searchQuery : '' })
    setShowExtraPhones(false)
  }

  const renderCustomerRow = (c: BookingCustomer, recent = false) => (
    <button
      key={c.id}
      onClick={() => selectCustomer(c)}
      className="w-full rounded-lg border border-border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
            {c.alternate_phone && <span>Alt: {c.alternate_phone}</span>}
            {c.emergency_phone && <span>Safety: {c.emergency_phone}</span>}
            {c.email && <span className="truncate">{c.email}</span>}
          </div>
          {recent && c.latest_booking_at && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last booking {new Date(c.latest_booking_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {c.blacklisted && <Badge variant="destructive" className="text-xs">Blacklisted</Badge>}
          <span className="rounded-full bg-background px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
            {c.total_bookings || 0} bookings
          </span>
        </div>
      </div>
    </button>
  )

  const extraPhoneControls = !showExtraPhones ? (
    <Button type="button" variant="outline" className="w-full" onClick={() => setShowExtraPhones(true)}>
      Add another mobile number
    </Button>
  ) : (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Alternate mobile <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            value={customer.alternate_phone || ''}
            onChange={(e) => setCustomer({ ...customer, alternate_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder="Second number"
          />
        </div>
        <div className="space-y-2">
          <Label>Safety mobile <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            value={customer.emergency_phone || ''}
            onChange={(e) => setCustomer({ ...customer, emergency_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder="Family / backup number"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setCustomer({ ...customer, alternate_phone: '', emergency_phone: '' })
          setShowExtraPhones(false)
        }}
      >
        Remove extra mobile numbers
      </Button>
    </div>
  )

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Customer Details
        </CardTitle>
        <CardDescription>Search for an existing customer or add a new one</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!customer.id && !isNew && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                {searching ? (
                  <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  placeholder="Search by name or phone number..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => refetchSearch()} disabled={searching || trimmedSearch.length < 1}>
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Results</p>
                {searchResults.map((c) => renderCustomerRow(c))}
              </div>
            )}

            {searchResults.length === 0 && trimmedSearch.length >= 1 && !searching && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No customers found</p>
              </div>
            )}

            {trimmedSearch.length < 1 && recentCustomers.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest Customers</p>
                <div className="space-y-2">
                  {recentCustomers.map((c) => renderCustomerRow(c, true))}
                </div>
              </div>
            )}

            {trimmedSearch.length < 1 && loadingRecent && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading latest customers...
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={startNew}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </>
        )}

        {(customer.id || isNew) && (
          <div className="space-y-4">
            {customer.id && (
              <>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3 text-foreground">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{customer.name}</p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {(customer.total_bookings || 0).toLocaleString('en-IN')} previous booking{customer.total_bookings === 1 ? '' : 's'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedPhones.map((phone) => (
                        <Badge key={phone.label} variant="outline" className="bg-background text-[11px]">
                          {phone.label}: {phone.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="hover:bg-muted text-primary" onClick={() => { setCustomer({ name: '', phone: '' }); setIsNew(false); setShowExtraPhones(false) }}>
                    Change
                  </Button>
                </div>
                {extraPhoneControls}
              </>
            )}

            {isNew && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full name *</Label>
                    <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="e.g. Arun Kumar" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone number *</Label>
                    <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" />
                  </div>
                </div>
                {extraPhoneControls}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email <span className="text-muted-foreground">(optional)</span></Label>
                    <Input value={customer.email || ''} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} type="email" placeholder="arun@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>ID type <span className="text-muted-foreground">(optional)</span></Label>
                    <Input value={customer.id_type || ''} onChange={(e) => setCustomer({ ...customer, id_type: e.target.value })} placeholder="Aadhaar, PAN, etc." />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ID number <span className="text-muted-foreground">(optional)</span></Label>
                    <Input value={customer.id_number || ''} onChange={(e) => setCustomer({ ...customer, id_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address <span className="text-muted-foreground">(optional)</span></Label>
                    <Input value={customer.address || ''} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ID Proof Image <span className="text-muted-foreground">(optional)</span></Label>
                  <ImageUpload
                    value={customer.id_proof_url || (customer.id_proof_file ? URL.createObjectURL(customer.id_proof_file) : null)}
                    onChange={(file) => setCustomer({ ...customer, id_proof_file: file })}
                    enableCameraCapture
                  />
                </div>
              </>
            )}

            {customer.id && !customer.id_proof_url && (
              <div className="space-y-2 border-t border-border pt-4">
                <Label>ID Proof Image <span className="text-muted-foreground">(optional)</span></Label>
                <ImageUpload
                  value={customer.id_proof_file ? URL.createObjectURL(customer.id_proof_file) : null}
                  onChange={(file) => setCustomer({ ...customer, id_proof_file: file })}
                  enableCameraCapture
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </>
  )
}
