import { useState, useEffect } from 'react'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, User, Loader2 } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookingCustomer[]>([])
  const [recentCustomers, setRecentCustomers] = useState<BookingCustomer[]>([])
  const [isNew, setIsNew] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [showExtraPhones, setShowExtraPhones] = useState(false)

  // Fetch recent customers on mount / when business ID is ready
  useEffect(() => {
    async function fetchRecentCustomers() {
      if (!staff?.business_id) return
      setLoadingRecent(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('customers')
          .select('id, name, phone, alternate_phone, emergency_phone, email, address, id_type, id_number, blacklisted, total_bookings')
          .eq('business_id', staff.business_id)
          .eq('branch_id', activeBranch?.id || staff.branch_id)
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentCustomers(data || [])
      } catch (err) {
        console.error('Failed to fetch recent customers:', err)
      } finally {
        setLoadingRecent(false)
      }
    }
    fetchRecentCustomers()
  }, [staff?.business_id, staff?.branch_id, activeBranch?.id])

  // Live search debounced query
  useEffect(() => {
    const query = searchQuery.trim()
    if (!query || !staff?.business_id) {
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('customers')
          .select('id, name, phone, alternate_phone, emergency_phone, email, address, id_type, id_number, blacklisted, total_bookings')
          .eq('business_id', staff.business_id)
          .eq('branch_id', activeBranch?.id || staff.branch_id)
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%,alternate_phone.ilike.%${query}%,emergency_phone.ilike.%${query}%,email.ilike.%${query}%`)
          .order('name', { ascending: true })
          .limit(5)
        setSearchResults(data || [])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, staff?.business_id, staff?.branch_id, activeBranch?.id])

  const handleSearch = async () => {
    const query = searchQuery.trim()
    if (!query || !staff?.business_id) return
    setSearching(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, alternate_phone, emergency_phone, email, address, id_type, id_number, blacklisted, total_bookings')
        .eq('business_id', staff.business_id)
        .eq('branch_id', activeBranch?.id || staff.branch_id)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,alternate_phone.ilike.%${query}%,emergency_phone.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name', { ascending: true })
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
    setShowExtraPhones(Boolean(c.alternate_phone || c.emergency_phone))
    setSearchResults([])
  }

  const startNew = () => {
    setIsNew(true)
    setCustomer({ name: '', phone: searchQuery.match(/\d{10}/) ? searchQuery : '' })
    setShowExtraPhones(false)
    setSearchResults([])
  }

  const extraPhoneControls = !showExtraPhones ? (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => setShowExtraPhones(true)}
    >
      Add another mobile number
    </Button>
  ) : (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="grid grid-cols-2 gap-4">
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
          <User className="w-5 h-5 text-primary" />
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
                {searching ? (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                )}
                <Input
                  placeholder="Search by name or phone number..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" onClick={handleSearch} disabled={searching || searchQuery.trim().length < 1}>
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Results</p>
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors text-left animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone} {c.email ? `· ${c.email}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(c as unknown as { blacklisted?: boolean }).blacklisted && <Badge variant="destructive" className="text-xs">Blacklisted</Badge>}
                      <span className="text-xs text-muted-foreground">{(c as unknown as { total_bookings?: number }).total_bookings || 0} bookings</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.trim().length >= 1 && !searching && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No customers found</p>
              </div>
            )}

            {/* Recent Customers List */}
            {searchQuery.trim().length < 1 && recentCustomers.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Customers</p>
                <div className="space-y-2">
                  {recentCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/60 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone} {c.email ? `· ${c.email}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(c as unknown as { blacklisted?: boolean }).blacklisted && <Badge variant="destructive" className="text-xs">Blacklisted</Badge>}
                        <span className="text-xs text-muted-foreground">{(c as unknown as { total_bookings?: number }).total_bookings || 0} bookings</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.trim().length < 1 && loadingRecent && (
              <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading recent customers...
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
              <>
                <div className="flex items-center justify-between p-3 bg-muted/40 border border-border text-foreground rounded-lg">
                  <div>
                    <p className="text-sm font-semibold">{customer.name}</p>
                    <p className="text-xs font-medium text-muted-foreground">{customer.phone}</p>
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
                {extraPhoneControls}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      value={customer.email || ''}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      type="email"
                      placeholder="arun@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID type <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      value={customer.id_type || ''}
                      onChange={(e) => setCustomer({ ...customer, id_type: e.target.value })}
                      placeholder="Aadhaar, PAN, etc."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID number <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      value={customer.id_number || ''}
                      onChange={(e) => setCustomer({ ...customer, id_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      value={customer.address || ''}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    />
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
              <div className="space-y-2 pt-4 border-t border-border">
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
