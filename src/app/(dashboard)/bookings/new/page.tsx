'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { createNewBookingFlow } from './booking-actions'
import { type DraftState, useBookingDraft } from './useBookingDraft'
import {
  Users, Package, CalendarDays, Calculator, CreditCard, Receipt,
  ChevronLeft, ChevronRight, CheckCircle, Loader2, X,
} from 'lucide-react'
import { CustomerStep } from './steps/CustomerStep'
import { ItemsStep } from './steps/ItemsStep'
import { DatesStep } from './steps/DatesStep'
import { PricingStep } from './steps/PricingStep'
import { PaymentStep } from './steps/PaymentStep'
import { ReceiptStep } from './steps/ReceiptStep'
import { resolveRentalDays } from '@/lib/booking-utils'

export interface BookingCustomer {
  id?: string
  name: string
  phone: string
  alternate_phone?: string
  emergency_phone?: string
  email?: string
  address?: string
  id_type?: string
  id_number?: string
  id_proof_url?: string
  id_proof_file?: File | null
}

export interface BookingItem {
  item_id: string
  variant_id: string
  name: string
  sku?: string
  size: string
  colour?: string
  price: number
  quantity: number
  cover_image_url?: string | null
}

export interface BookingDates {
  event_date: string
  pickup_date: string
  return_date: string
  rental_days_override?: number
  fitting_date?: string
  occasion?: string
  booking_source?: 'walk_in' | 'phone' | 'whatsapp' | 'referral' | 'repeat'
  customer_requests?: string[]
  notes?: string
}

export interface BookingPricing {
  subtotal: number
  discount_type: 'flat' | 'percentage'
  discount_value: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  delivery_fee: number
}

export interface BookingPayment {
  advance_amount: number
  deposit_amount: number
  method: 'cash' | 'upi' | 'card' | 'bank_transfer'
  reference?: string
  physical_bill_number?: string
  notes?: string
}

const STEPS = [
  { label: 'Customer', icon: Users },
  { label: 'Dates', icon: CalendarDays },
  { label: 'Items', icon: Package },
  { label: 'Pricing', icon: Calculator },
  { label: 'Payment', icon: CreditCard },
  { label: 'Receipt', icon: Receipt },
]

export default function NewBookingPage() {
  const router = useRouter()
  const { activeBranch, staff } = useAppStore()
  const bookingRules = ((activeBranch?.settings as any) || {})
  const minAdvancePct = Number(bookingRules.min_advance_pct ?? 30)
  const bufferDays = Number(bookingRules.buffer_days ?? 1)
  const minRentalDays = Number(bookingRules.min_rental_days ?? 1)
  const maxBookingWindow = Number(bookingRules.max_booking_window ?? 180)
  const allowSameDayBooking = bookingRules.allow_same_day_booking ?? true
  const requirePhysicalBill = bookingRules.require_physical_bill_number ?? false
  const requireCustomerIdProof = bookingRules.require_customer_id_proof ?? false
  const enforceStockLimit = bookingRules.enforce_stock_limit ?? false
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<DraftState | null>(null)
  const [checkedDraft, setCheckedDraft] = useState(false)

  // Step state
  const [customer, setCustomer] = useState<BookingCustomer>({ name: '', phone: '' })
  const [items, setItems] = useState<BookingItem[]>([])
  const [dates, setDates] = useState<BookingDates>({ event_date: '', pickup_date: '', return_date: '' })
  const [pricing, setPricing] = useState<BookingPricing>({
    subtotal: 0, discount_type: 'flat', discount_value: 0,
    discount_amount: 0, tax_amount: 0, total_amount: 0, delivery_fee: 0,
  })
  const [payment, setPayment] = useState<BookingPayment>({
    advance_amount: 0, deposit_amount: 0, method: 'cash',
  })

  // Draft auto-save
  const { clearDraft, loadDraft, saveDraft } = useBookingDraft(
    { currentStep, customer, items, dates, pricing, payment },
    {
      businessId: staff?.business_id ?? undefined,
      branchId: activeBranch?.id ?? undefined,
      staffId: staff?.id ?? undefined,
      enabled: currentStep < 5, // Stop auto-saving once receipt shown
    }
  )

  useEffect(() => {
    if (checkedDraft || !staff?.business_id || !activeBranch?.id || !staff?.id) return

    let cancelled = false
    async function checkDraft() {
      const draft = await loadDraft()
      if (cancelled) return
      setCheckedDraft(true)

      const hasContent = Boolean(
        draft?.customer?.name ||
        draft?.customer?.phone ||
        draft?.items?.length ||
        draft?.dates?.pickup_date ||
        draft?.dates?.return_date ||
        draft?.pricing?.total_amount ||
        draft?.payment?.advance_amount
      )
      if (draft && hasContent) setPendingDraft(draft)
    }

    void checkDraft()
    return () => {
      cancelled = true
    }
  }, [activeBranch?.id, checkedDraft, loadDraft, staff?.business_id, staff?.id])

  function restoreDraft(draft: DraftState) {
    setCurrentStep(Math.min(Math.max(draft.currentStep || 0, 0), 4))
    setCustomer({ ...draft.customer, id_proof_file: null })
    setItems(draft.items || [])
    setDates(draft.dates || { event_date: '', pickup_date: '', return_date: '' })
    setPricing(draft.pricing || {
      subtotal: 0, discount_type: 'flat', discount_value: 0,
      discount_amount: 0, tax_amount: 0, total_amount: 0, delivery_fee: 0,
    })
    setPayment(draft.payment || { advance_amount: 0, deposit_amount: 0, method: 'cash' })
    setPendingDraft(null)
    toast.success('Draft restored')
  }

  async function discardDraft() {
    await clearDraft()
    setPendingDraft(null)
    toast.success('Draft discarded')
  }

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return !!customer.name
          && !!customer.phone
          && customer.phone.length >= 10
          && (!requireCustomerIdProof || !!customer.id_proof_url || !!customer.id_proof_file)
      case 1: {
        if (!dates.event_date || !dates.pickup_date || !dates.return_date) return false
        const rentalDays = resolveRentalDays(dates.pickup_date, dates.return_date, dates.rental_days_override)
        if (rentalDays < minRentalDays) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const pickup = new Date(dates.pickup_date)
        pickup.setHours(0, 0, 0, 0)
        if (!allowSameDayBooking && pickup.getTime() === today.getTime()) return false
        const maxPickup = new Date(today)
        maxPickup.setDate(maxPickup.getDate() + maxBookingWindow)
        if (pickup > maxPickup) return false
        return true
      }
      case 2: return items.length > 0
      case 3: return pricing.total_amount > 0
      case 4: {
        return payment.advance_amount >= 0
          && payment.advance_amount <= pricing.total_amount
          && (!requirePhysicalBill || !!payment.physical_bill_number?.trim())
      }
      default: return true
    }
  }, [allowSameDayBooking, currentStep, customer, dates, items.length, maxBookingWindow, minRentalDays, payment.advance_amount, payment.physical_bill_number, pricing.total_amount, requireCustomerIdProof, requirePhysicalBill])

  const handleNext = () => {
    if (currentStep === 2) {
      // Auto-calculate pricing when moving from dates
      const rentalDays = resolveRentalDays(dates.pickup_date, dates.return_date, dates.rental_days_override)
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity * rentalDays, 0)
      setPricing((prev) => ({
        ...prev,
        subtotal,
        total_amount: subtotal - prev.discount_amount + prev.delivery_fee,
      }))
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (!staff || !activeBranch) throw new Error('Not authenticated')

      let idProofUrl = customer.id_proof_url
      if (customer.id_proof_file && staff?.business_id) {
        const { StorageService } = await import('@/lib/storage-service')
        idProofUrl = await StorageService.uploadCustomerID(staff.business_id, customer.id_proof_file)
      }

      const result = await createNewBookingFlow({
        customer: { ...customer, id_proof_url: idProofUrl },
        items,
        dates,
        pricing,
        payment,
        staffId: staff.id,
        businessId: staff.business_id!,
        branchId: activeBranch.id
      })

      if (!result.success) throw new Error(result.error as string)

      setCreatedBookingId(result.bookingId!)
      setCurrentStep(5) // Receipt step
      clearDraft() // Remove saved draft on success
      toast.success(`Booking ${result.bookingNumber} created!`)
    } catch (err: any) {
      console.error('Booking creation error:', err)
      toast.error(err.message || 'Failed to create booking. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={async () => { await saveDraft(); router.push('/bookings') }}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-foreground">New Booking</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={async () => { await saveDraft(); router.push('/bookings') }}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {pendingDraft && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-950">Resume saved booking draft?</p>
              <p className="text-xs text-amber-800">
                A booking was saved from this device. Continue from step {Math.min((pendingDraft.currentStep || 0) + 1, 5)} with {pendingDraft.items?.length || 0} item{pendingDraft.items?.length === 1 ? '' : 's'}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="bg-white" onClick={discardDraft}>
                Discard
              </Button>
              <Button type="button" size="sm" onClick={() => restoreDraft(pendingDraft)}>
                Resume
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive = i === currentStep
          const isDone = i < currentStep
          return (
            <div key={step.label} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                isDone ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs hidden sm:block ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card className="shadow-sm border-border">
        {currentStep === 0 && <CustomerStep customer={customer} setCustomer={setCustomer} />}
        {currentStep === 1 && <DatesStep dates={dates} setDates={setDates} />}
        {currentStep === 2 && <ItemsStep items={items} setItems={setItems} dates={dates} bufferDays={bufferDays} enforceStockLimit={enforceStockLimit} />}
        {currentStep === 3 && <PricingStep pricing={pricing} setPricing={setPricing} items={items} setItems={setItems} dates={dates} />}
        {currentStep === 4 && <PaymentStep payment={payment} setPayment={setPayment} totalAmount={pricing.total_amount} minAdvancePct={minAdvancePct} requirePhysicalBill={requirePhysicalBill} />}
        {currentStep === 5 && <ReceiptStep bookingId={createdBookingId} customer={customer} items={items} dates={dates} pricing={pricing} payment={payment} />}
      </Card>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {currentStep < 4 ? (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]" onClick={handleSubmit} disabled={!canProceed() || saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Confirm & Create →'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
