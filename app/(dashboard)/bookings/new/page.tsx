'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingDraftStore, type DraftCustomer, type DraftItem } from '@/lib/stores/useBookingDraftStore'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useCustomerList, useCreateCustomer } from '@/lib/queries/customers'
import { useInventory } from '@/lib/queries/inventory'
import { useCreateFullBooking } from '@/lib/queries/useBookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ReceiptPreview } from '@/components/bookings/ReceiptPreview'
import {
  ChevronRight, ArrowLeft, Check, Search, UserPlus, X, Plus, Minus,
  AlertCircle, CheckCircle2, ShoppingBag, Calendar as CalendarIcon,
  Package, SplitSquareVertical,
} from 'lucide-react'
import { differenceInCalendarDays, addDays, format, parseISO, isAfter, isBefore } from 'date-fns'
import type { Customer } from '@/lib/stores/customerStore'

const STEPS = [
  { id: 1, title: 'Customer' },
  { id: 2, title: 'Items' },
  { id: 3, title: 'Dates' },
  { id: 4, title: 'Pricing' },
  { id: 5, title: 'Payment' },
  { id: 6, title: 'Confirm' },
]

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Store Credit'] as const
type PMethod = typeof PAYMENT_METHODS[number]

// ── Main Page ────────────────────────────────────────────────────────────────

export default function NewBookingWizard() {
  const router = useRouter()
  const store = useBookingDraftStore()
  const createBooking = useCreateFullBooking()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const profile = useUserStore((s) => s.profile)

  const canAdvance = () => {
    switch (store.currentStep) {
      case 1: return !!store.customer?.id
      case 2: return store.items.length > 0 && store.items.every(i => Object.values(i.sizes).some(q => q > 0))
      case 3: return !!(store.dates?.pickup_date && store.dates?.return_date)
      case 4: return !!(store.pricing?.total_amount)
      case 5: {
        const p = store.payment
        if (!p) return false
        return p.advance_amount > 0 && p.method_1 !== undefined
      }
      default: return true
    }
  }

  const nextStep = () => {
    if (store.currentStep < 6 && canAdvance()) store.setStep(store.currentStep + 1)
  }

  const prevStep = () => {
    if (store.currentStep > 1) store.setStep(store.currentStep - 1)
    else router.push('/bookings')
  }

  const handleConfirm = async () => {
    if (!store.customer?.id || !store.dates || !store.pricing || !store.payment) return

    try {
      const result = await createBooking.mutateAsync({
        customer_id: store.customer.id,
        items: store.items,
        pickup_date: store.dates.pickup_date,
        return_date: store.dates.return_date,
        total_days: store.dates.total_days,
        total_amount: store.pricing.total_amount,
        deposit_amount: store.pricing.deposit_amount,
        payment_method_1: store.payment.method_1,
        payment_amount_1: store.payment.amount_1,
        payment_method_2: store.payment.method_2,
        payment_amount_2: store.payment.amount_2,
        occasion: store.occasion,
        source: store.source,
        notes: store.notes,
        price_override_amount: store.pricing.override_price,
        price_override_reason: store.pricing.override_reason,
      })
      store.resetDraft()
      router.push(`/bookings/${result.id}?print=true`)
    } catch (err) {
      console.error('[booking] creation failed:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header + Stepper */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStep}
            className="shrink-0 h-10 w-10 border border-zinc-200 dark:border-zinc-800 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">New Booking</h1>
            <p className="text-zinc-500 text-sm">
              Step {store.currentStep} of 6 — {STEPS[store.currentStep - 1].title}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((step) => (
            <div key={step.id} className="flex-1 min-w-[60px]">
              <div
                className={`h-1.5 rounded-full mb-1.5 transition-colors ${
                  store.currentStep > step.id
                    ? 'bg-[#ccff00]'
                    : store.currentStep === step.id
                    ? 'bg-zinc-900 dark:bg-zinc-100'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
              <span className={`text-xs font-medium px-0.5 truncate block ${
                store.currentStep === step.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
              }`}>
                {step.id}. {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 rounded-2xl shadow-sm min-h-[420px]">
        {store.currentStep === 1 && <CustomerStep />}
        {store.currentStep === 2 && <ItemsStep />}
        {store.currentStep === 3 && <DatesStep />}
        {store.currentStep === 4 && <PricingStep />}
        {store.currentStep === 5 && <PaymentStep />}
        {store.currentStep === 6 && <ConfirmStep />}
      </div>

      {/* Footer Nav */}
      <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button variant="outline" onClick={prevStep} className="h-11 px-6 font-semibold">
          {store.currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        {store.currentStep < 6 ? (
          <Button
            onClick={nextStep}
            disabled={!canAdvance()}
            className="h-11 px-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold disabled:opacity-40"
          >
            Continue <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={createBooking.isPending}
            className="h-11 px-8 bg-[#ccff00] text-black hover:bg-[#bce600] font-bold"
          >
            {createBooking.isPending ? (
              'Creating...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" /> Confirm Booking
              </>
            )}
          </Button>
        )}
      </div>
      {createBooking.isError && (
        <p className="text-sm text-red-600 text-center">
          {(createBooking.error as Error)?.message ?? 'Failed to create booking'}
        </p>
      )}
    </div>
  )
}

// ── Step 1: Customer ─────────────────────────────────────────────────────────

function CustomerStep() {
  const store = useBookingDraftStore()
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const profile = useUserStore((s) => s.profile)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const createCustomer = useCreateCustomer()

  const { data: customers, isLoading } = useCustomerList(
    search.length >= 3 ? { search } : {}
  )

  const handleSelect = (c: Customer) => {
    store.setCustomer({ id: c.id, name: c.name, phone: c.phone, email: c.email ?? '', tier: c.tier, risk_score: c.risk_level })
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim() || !activeBranchId || !profile?.business_id) return
    const result = await createCustomer.mutateAsync({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      branch_id: activeBranchId,
      business_id: profile.business_id,
      created_by: profile.id,
    })
    store.setCustomer({ id: result.id, name: result.name, phone: result.phone, email: result.email ?? '', tier: result.tier })
    setShowCreate(false)
  }

  if (store.customer?.id) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h3 className="text-lg font-semibold">Customer Selected</h3>
        <div className="flex items-center justify-between p-5 border-2 border-[#ccff00] rounded-xl bg-[#ccff00]/5">
          <div>
            <p className="font-bold text-lg">{store.customer.name}</p>
            <p className="text-zinc-500 text-sm">{store.customer.phone}</p>
            {store.customer.tier && (
              <Badge variant="secondary" className="mt-1 capitalize">{store.customer.tier}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#88aa00]" />
            <Button variant="ghost" size="sm" onClick={() => store.setCustomer({ name: '', phone: '' })}>
              Change
            </Button>
          </div>
        </div>

        {/* Occasion + Source */}
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div className="space-y-2">
            <Label>Occasion</Label>
            <Select value={store.occasion} onValueChange={(v: string | null) => store.setOccasion(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Select occasion" /></SelectTrigger>
              <SelectContent>
                {['Wedding', 'Reception', 'Mehendi', 'Festival', 'Party', 'Other'].map(o => (
                  <SelectItem key={o} value={o.toLowerCase()}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={store.source} onValueChange={(v: string | null) => store.setSource((v ?? 'Walk-in') as typeof store.source)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Phone call">Phone call</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold">Find or Create Customer</h3>

      {!showCreate ? (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="pl-9 h-11"
              autoFocus
            />
          </div>

          {search.length >= 3 && (
            <div className="space-y-2 max-w-lg">
              {isLoading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)
              ) : (customers ?? []).length === 0 ? (
                <div className="py-8 text-center text-zinc-500">
                  <p className="text-sm">No customers found for "{search}"</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={() => { setShowCreate(true); setNewPhone(search) }}
                  >
                    <UserPlus className="w-4 h-4" /> Create New Customer
                  </Button>
                </div>
              ) : (
                (customers ?? []).map((c: Customer) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className="w-full flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#ccff00] hover:bg-[#ccff00]/5 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-zinc-500">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.tier && <Badge variant="secondary" className="capitalize text-xs">{c.tier}</Badge>}
                      {c.risk_level === 'high' && <Badge variant="destructive" className="text-xs">High Risk</Badge>}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {search.length < 3 && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-zinc-400">or</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
                <UserPlus className="w-4 h-4" /> New Customer
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 max-w-sm animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">New Customer</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Aarti Sharma" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+91 9876543210" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-zinc-400 font-normal">(optional)</span></Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="aarti@example.com" className="h-11" />
            </div>
          </div>
          {createCustomer.isError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {(createCustomer.error as Error)?.message}
            </p>
          )}
          <Button
            onClick={handleCreate}
            disabled={!newName.trim() || !newPhone.trim() || createCustomer.isPending}
            className="w-full h-11 bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold"
          >
            {createCustomer.isPending ? 'Creating...' : 'Create & Select'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Items ─────────────────────────────────────────────────────────────

function ItemsStep() {
  const store = useBookingDraftStore()
  const [search, setSearch] = useState('')

  const { data: items, isLoading } = useInventory(
    search.length >= 2 ? { search } : { status: 'available' }
  )

  const handleAddItem = (item: Record<string, unknown>) => {
    const draftItem: DraftItem = {
      id: item.id as string,
      sku: (item.sku as string) ?? '',
      name: item.name as string,
      category: (item.category as string) ?? '',
      price: (item.price as number) ?? 0,
      cover_photo: item.cover_photo_url as string | undefined,
      sizes: {},
    }
    store.addItem(draftItem)
  }

  const handleRemoveItem = (id: string) => store.removeItem(id)

  const handleSizeChange = (itemId: string, size: string, qty: number) => {
    const current = store.items.find(i => i.id === itemId)
    if (!current) return
    const updatedSizes = { ...current.sizes, [size]: Math.max(0, qty) }
    if (updatedSizes[size] === 0) delete updatedSizes[size]
    store.updateItemSizes(itemId, updatedSizes)
  }

  const itemIds = new Set(store.items.map(i => i.id))
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold">Select Items</h3>
        {store.items.length > 0 && (
          <Badge className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            {store.items.length} item{store.items.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, SKU, category..."
          className="pl-9 h-11"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Results */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Inventory</p>
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : (items ?? []).length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">No items found</p>
          ) : (
            (items as Record<string, unknown>[]).slice(0, 10).map((item) => {
              const isAdded = itemIds.has(item.id as string)
              return (
                <div
                  key={item.id as string}
                  className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${
                    isAdded
                      ? 'border-[#ccff00] bg-[#ccff00]/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name as string}</p>
                      <p className="text-xs text-zinc-500">
                        {item.sku as string} · ₹{item.price as number}/day
                      </p>
                    </div>
                  </div>
                  {isAdded ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id as string)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddItem(item)}
                      className="gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Cart with size selection */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Selected Items</p>
          {store.items.length === 0 ? (
            <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center">
              <ShoppingBag className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No items added yet</p>
            </div>
          ) : (
            store.items.map((item) => (
              <div key={item.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{item.name}</p>
                  <button onClick={() => handleRemoveItem(item.id)} className="text-zinc-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500">₹{item.price}/day · Select sizes & qty:</p>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(size => {
                    const qty = item.sizes[size] ?? 0
                    return (
                      <div key={size} className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                        qty > 0
                          ? 'border-[#ccff00] bg-[#ccff00]/10 text-zinc-900'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}>
                        <span className="font-medium w-8 text-center">{size}</span>
                        <button
                          onClick={() => handleSizeChange(item.id, size, qty - 1)}
                          disabled={qty === 0}
                          className="disabled:opacity-30 hover:text-zinc-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-bold">{qty}</span>
                        <button
                          onClick={() => handleSizeChange(item.id, size, qty + 1)}
                          className="hover:text-zinc-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
                {Object.values(item.sizes).every(q => q === 0) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Select at least one size
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Dates ─────────────────────────────────────────────────────────────

function DatesStep() {
  const store = useBookingDraftStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const minReturn = store.dates?.pickup_date
    ? format(addDays(parseISO(store.dates.pickup_date), 1), 'yyyy-MM-dd')
    : today

  const handlePickupChange = (val: string) => {
    const ret = store.dates?.return_date
    if (ret && isBefore(parseISO(ret), parseISO(val))) {
      // Auto-advance return date
      const newRet = format(addDays(parseISO(val), 1), 'yyyy-MM-dd')
      const days = differenceInCalendarDays(parseISO(newRet), parseISO(val))
      store.setDates({ pickup_date: val, return_date: newRet, total_days: Math.max(1, days) })
    } else if (ret) {
      const days = differenceInCalendarDays(parseISO(ret), parseISO(val))
      store.setDates({ pickup_date: val, return_date: ret, total_days: Math.max(1, days) })
    } else {
      store.setDates({ pickup_date: val, return_date: '', total_days: 0 })
    }
  }

  const handleReturnChange = (val: string) => {
    const pickup = store.dates?.pickup_date ?? today
    const days = differenceInCalendarDays(parseISO(val), parseISO(pickup))
    store.setDates({ pickup_date: pickup, return_date: val, total_days: Math.max(1, days) })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold">Pickup & Return Dates</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
        <div className="space-y-2">
          <Label>Pickup Date *</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              type="date"
              min={today}
              value={store.dates?.pickup_date ?? ''}
              onChange={e => handlePickupChange(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Return Date *</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              type="date"
              min={minReturn}
              value={store.dates?.return_date ?? ''}
              onChange={e => handleReturnChange(e.target.value)}
              className="pl-9 h-11"
              disabled={!store.dates?.pickup_date}
            />
          </div>
        </div>
      </div>

      {store.dates?.total_days && store.dates.total_days > 0 ? (
        <div className="max-w-lg p-4 rounded-xl border border-[#ccff00] bg-[#ccff00]/5 space-y-1">
          <p className="text-sm font-semibold">
            {store.dates.total_days} rental day{store.dates.total_days > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-zinc-500">
            {format(parseISO(store.dates.pickup_date), 'EEE, dd MMM')} → {format(parseISO(store.dates.return_date), 'EEE, dd MMM yyyy')}
          </p>
        </div>
      ) : null}

      <div className="max-w-lg space-y-2">
        <Label>Occasion Notes <span className="text-zinc-400 font-normal">(optional)</span></Label>
        <Textarea
          value={store.notes}
          onChange={e => store.setNotes(e.target.value)}
          placeholder="e.g. Wedding on 5th, needs fitting on pickup day"
          className="resize-none h-20"
        />
      </div>
    </div>
  )
}

// ── Step 4: Pricing ───────────────────────────────────────────────────────────

function PricingStep() {
  const store = useBookingDraftStore()

  const days = store.dates?.total_days ?? 1
  const subtotal = store.items.reduce((sum, item) => {
    const totalQty = Object.values(item.sizes).reduce((a, b) => a + b, 0)
    return sum + item.price * totalQty * days
  }, 0)

  const [useOverride, setUseOverride] = useState(!!store.pricing?.override_price)
  const [overrideAmount, setOverrideAmount] = useState(store.pricing?.override_price?.toString() ?? '')
  const [overrideReason, setOverrideReason] = useState(store.pricing?.override_reason ?? '')
  const [deposit, setDeposit] = useState(store.pricing?.deposit_amount?.toString() ?? '')

  const finalAmount = useOverride && Number(overrideAmount) > 0 ? Number(overrideAmount) : subtotal

  useEffect(() => {
    store.setPricing({
      subtotal,
      override_price: useOverride && Number(overrideAmount) > 0 ? Number(overrideAmount) : undefined,
      override_reason: useOverride ? overrideReason : undefined,
      deposit_amount: Number(deposit) || 0,
      total_amount: finalAmount,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, useOverride, overrideAmount, overrideReason, deposit])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-lg">
      <h3 className="text-lg font-semibold">Pricing</h3>

      {/* Item breakdown */}
      <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Breakdown</p>
        {store.items.map(item => {
          const totalQty = Object.values(item.sizes).reduce((a, b) => a + b, 0)
          const sizeLabel = Object.entries(item.sizes)
            .filter(([, q]) => q > 0)
            .map(([s, q]) => `${s}×${q}`)
            .join(', ')
          return (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">
                {item.name} <span className="text-xs text-zinc-400">({sizeLabel})</span>
              </span>
              <span className="font-mono font-medium">₹{(item.price * totalQty * days).toLocaleString('en-IN')}</span>
            </div>
          )
        })}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-semibold">
          <span>Subtotal ({days} day{days > 1 ? 's' : ''})</span>
          <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Override */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="override"
            checked={useOverride}
            onChange={e => setUseOverride(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="override" className="text-sm font-medium cursor-pointer">Override price</label>
        </div>
        {useOverride && (
          <div className="space-y-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-top-1 duration-200">
            <div className="space-y-1.5">
              <Label>Override Amount (₹)</Label>
              <Input
                type="number"
                value={overrideAmount}
                onChange={e => setOverrideAmount(e.target.value)}
                placeholder="0"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Input
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="e.g. Loyalty discount, Manager approval"
                className="h-11"
              />
            </div>
          </div>
        )}
      </div>

      {/* Deposit */}
      <div className="space-y-1.5">
        <Label>Security Deposit (₹)</Label>
        <Input
          type="number"
          value={deposit}
          onChange={e => setDeposit(e.target.value)}
          placeholder="0"
          className="h-11"
        />
        <p className="text-xs text-zinc-500">Collected separately, refunded on clean return</p>
      </div>

      {/* Final total */}
      <div className="flex justify-between items-center p-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
        <span className="font-bold">Rental Total</span>
        <span className="font-mono font-bold text-xl">₹{finalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

// ── Step 5: Payment ───────────────────────────────────────────────────────────

function PaymentStep() {
  const store = useBookingDraftStore()
  const total = store.pricing?.total_amount ?? 0
  const MIN_ADVANCE_PCT = 30 // default; ideally from branch settings

  const [method1, setMethod1] = useState<PMethod>(store.payment?.method_1 as PMethod ?? 'Cash')
  const [amount1, setAmount1] = useState(store.payment?.amount_1?.toString() ?? String(Math.ceil(total * MIN_ADVANCE_PCT / 100)))
  const [split, setSplit] = useState(!!(store.payment?.method_2))
  const [method2, setMethod2] = useState<PMethod>(store.payment?.method_2 as PMethod ?? 'UPI')
  const [amount2, setAmount2] = useState(store.payment?.amount_2?.toString() ?? '0')
  const [depositMethod, setDepositMethod] = useState<PMethod>('Cash')

  const advanceTotal = Number(amount1) + (split ? Number(amount2) : 0)
  const depositAmt = store.pricing?.deposit_amount ?? 0
  const minAdvance = Math.ceil(total * MIN_ADVANCE_PCT / 100)
  const belowMin = advanceTotal < minAdvance

  useEffect(() => {
    store.setPayment({
      method_1: method1,
      amount_1: Number(amount1),
      method_2: split ? method2 : undefined,
      amount_2: split ? Number(amount2) : undefined,
      advance_amount: advanceTotal,
      deposit_amount: depositAmt,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method1, amount1, split, method2, amount2])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-lg">
      <h3 className="text-lg font-semibold">Advance Payment</h3>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between text-sm">
        <span className="text-zinc-500">Rental Total</span>
        <span className="font-bold font-mono">₹{total.toLocaleString('en-IN')}</span>
      </div>

      {belowMin && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Minimum advance is {MIN_ADVANCE_PCT}% (₹{minAdvance.toLocaleString('en-IN')}). Manager approval required for less.</span>
        </div>
      )}

      {/* Payment 1 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Method</Label>
          <Select value={method1} onValueChange={(v) => setMethod1(v as PMethod)}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹)</Label>
          <Input
            type="number"
            value={amount1}
            onChange={e => setAmount1(e.target.value)}
            className="h-11 font-mono"
          />
        </div>
      </div>

      {/* Split toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="split"
          checked={split}
          onChange={e => setSplit(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="split" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
          <SplitSquareVertical className="w-4 h-4" /> Split payment
        </label>
      </div>

      {split && (
        <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-top-1 duration-200">
          <div className="space-y-1.5">
            <Label>Method 2</Label>
            <Select value={method2} onValueChange={(v) => setMethod2(v as PMethod)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={amount2}
              onChange={e => setAmount2(e.target.value)}
              className="h-11 font-mono"
            />
          </div>
        </div>
      )}

      {/* Deposit */}
      {depositAmt > 0 && (
        <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-semibold">Security Deposit — ₹{depositAmt.toLocaleString('en-IN')}</p>
          <div className="space-y-1.5">
            <Label>Deposit Method</Label>
            <Select value={depositMethod} onValueChange={(v) => setDepositMethod(v as PMethod)}>
              <SelectTrigger className="h-11 max-w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Advance Collected</span>
          <span className={`font-mono font-bold ${belowMin ? 'text-amber-600' : 'text-emerald-600'}`}>
            ₹{advanceTotal.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Balance Due at Pickup</span>
          <span className="font-mono font-medium">₹{Math.max(0, total - advanceTotal).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  )
}

// ── Step 6: Confirm ───────────────────────────────────────────────────────────

function ConfirmStep() {
  const store = useBookingDraftStore()
  const { items, customer, dates, pricing, payment } = store

  const draft = {
    customer: { name: customer?.name, phone: customer?.phone },
    selectedItems: items.map(item => ({
      name: item.name,
      size: Object.entries(item.sizes).filter(([, q]) => q > 0).map(([s, q]) => `${s}×${q}`).join(', '),
      quantity: Object.values(item.sizes).reduce((a, b) => a + b, 0),
      price: item.price,
      item: { name: item.name, price: item.price },
    })),
    pricing: {
      total: pricing?.total_amount ?? 0,
      advance: payment?.advance_amount ?? 0,
      deposit: pricing?.deposit_amount ?? 0,
    },
    payment: {
      advance: payment?.advance_amount ?? 0,
      deposit: pricing?.deposit_amount ?? 0,
    },
    booking_id_display: 'PREVIEW',
    pickup_date: dates?.pickup_date,
    return_date: dates?.return_date,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold">Review & Confirm</h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Customer</p>
            </div>
            <div className="p-4 space-y-1.5 text-sm">
              <Row label="Name" value={customer?.name} />
              <Row label="Phone" value={customer?.phone} />
              {customer?.tier && <Row label="Tier" value={customer.tier} />}
              <Row label="Source" value={store.source} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dates</p>
            </div>
            <div className="p-4 space-y-1.5 text-sm">
              <Row label="Pickup" value={dates?.pickup_date ? format(parseISO(dates.pickup_date), 'EEE, dd MMM yyyy') : '—'} />
              <Row label="Return" value={dates?.return_date ? format(parseISO(dates.return_date), 'EEE, dd MMM yyyy') : '—'} />
              <Row label="Duration" value={`${dates?.total_days ?? 0} day${(dates?.total_days ?? 0) > 1 ? 's' : ''}`} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Payment</p>
            </div>
            <div className="p-4 space-y-1.5 text-sm">
              <Row label="Rental Total" value={`₹${(pricing?.total_amount ?? 0).toLocaleString('en-IN')}`} />
              {pricing?.override_price && (
                <Row label="Override" value={`₹${pricing.override_price.toLocaleString('en-IN')} (${pricing.override_reason ?? ''})`} />
              )}
              <Row label="Advance Paid" value={`₹${(payment?.advance_amount ?? 0).toLocaleString('en-IN')}`} />
              <Row label="Deposit" value={`₹${(pricing?.deposit_amount ?? 0).toLocaleString('en-IN')}`} />
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold">
                <span>Balance Due</span>
                <span className="font-mono text-amber-600">
                  ₹{Math.max(0, (pricing?.total_amount ?? 0) - (payment?.advance_amount ?? 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 self-start">Receipt Preview</p>
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
            <ReceiptPreview booking={draft} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="font-medium text-right">{value ?? '—'}</span>
    </div>
  )
}
