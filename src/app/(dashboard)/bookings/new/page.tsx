'use client'

import { paymentError } from '@/lib/payment-splits'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { createNewBookingFlow } from './booking-actions'
import { useBookingDraft, type DraftState } from './useBookingDraft'
import { bookingNumberError, normalizeBookingNumber } from '@/lib/booking-number'
import {
  Users, Package, CalendarDays, Calculator, CreditCard, Receipt,
  ChevronLeft, ChevronRight, CheckCircle, Loader2, X,
} from 'lucide-react'
import { CustomerStep } from './steps/CustomerStep'
import { ItemsStep } from './steps/ItemsStep'
import { BookingPreparation } from './steps/BookingPreparation'
import { DatesStep } from './steps/DatesStep'
import { PricingStep } from './steps/PricingStep'
import { PaymentStep } from './steps/PaymentStep'
import { ReceiptStep } from './steps/ReceiptStep'
import { calculateBookingPricing, applyBookingTax } from '@/lib/booking-pricing'

export interface BookingCustomer {
  id?: string
  name: string
  phone: string
  additional_phones?: string[]
  branch_id?: string
  total_bookings?: number
  email?: string
  address?: string
  id_type?: string
  id_number?: string
  id_proof_url?: string
  id_proof_file?: File | null
}

export interface BookingItem {
  booking_item_id?: string
  rental_days?: number
  rate_basis?: string
  item_id: string
  variant_id: string
  name: string
  sku?: string
  size: string
  price: number
  discount_percent?: number
  discount_flat?: number | null
  quantity: number
  cover_image_url?: string | null
}

export interface BookingDates {
  alteration_notes?: string
  condition_notes?: string
  condition_photos?: string[]
  order_taken_by?: string
  event_date: string
  pickup_date: string
  return_date: string
  fitting_date?: string
  occasion?: string
  booking_source?: 'walk_in' | 'phone' | 'whatsapp' | 'referral' | 'repeat'
  notes?: string
  overbook_reason?: string
}

export interface BookingPricing {
  subtotal: number
  discount_type: 'flat' | 'percentage'
  discount_value: number
  discount_amount: number
  tax_amount: number
  total_amount: number
}

export interface BookingPayment {
  splits?: import('@/lib/payment-splits').PaymentPart[]
  deposit_splits?: import('@/lib/payment-splits').PaymentPart[]
  deposit_method?: import('@/lib/payment-splits').PaymentMethod
  deposit_reference?: string
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
  const { activeBranch, staff } = useAppStore()
  const [revision, setRevision] = useState(0)
  if (!activeBranch || !staff) return <p className="text-sm text-muted-foreground">Loading booking…</p>
  return <NewBookingForm key={staff.id + ':' + activeBranch.id + ':' + revision} onCreateAnother={() => setRevision(value => value + 1)} />
}

function NewBookingForm({ onCreateAnother }: { onCreateAnother: () => void }) {
  const router = useRouter()
  const requestId = useRef<string>(crypto.randomUUID())
  const { activeBranch, staff } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploadingCondition, setUploadingCondition] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)
  const [createdBookingNumber, setCreatedBookingNumber] = useState<string | null>(null)
  const [customBookingNumber, setCustomBookingNumber] = useState('')

  // Step state
  const [customer, setCustomer] = useState<BookingCustomer>({ name: '', phone: '' })
  const [items, setItems] = useState<BookingItem[]>([])
  const [dates, setDates] = useState<BookingDates>({ event_date: '', pickup_date: '', return_date: '', order_taken_by: staff?.name ?? '' })
  const pricing: BookingPricing = { ...applyBookingTax(calculateBookingPricing(items), activeBranch?.settings?.invoice), discount_type: 'flat', discount_value: 0 }
  const [payment, setPayment] = useState<BookingPayment>({
    advance_amount: 0, deposit_amount: 0, method: 'cash',
  })

  const restoreDraft = useCallback((draft: DraftState) => {
    requestId.current = draft.requestId || crypto.randomUUID()
    setCustomer(draft.customer)
    setItems(draft.items)
    setDates(draft.dates)
    setPayment(draft.payment)
    setCustomBookingNumber(draft.customBookingNumber ?? '')
    setCurrentStep(Math.max(0, Math.min(draft.currentStep, 4)))
    toast.success('Booking draft restored')
  }, [])

  // Draft auto-save
  const { clearDraft, saveDraft, ready: draftReady } = useBookingDraft(
    { currentStep, customer, items, dates, pricing, payment, customBookingNumber, requestId: requestId.current },
    {
      businessId: staff?.business_id ?? undefined,
      branchId: activeBranch?.id ?? undefined,
      staffId: staff?.id ?? undefined,
      enabled: currentStep < 5 && !saving, // Stop auto-saving during submission and after completion
      onRestore: restoreDraft,
    }
  )

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: return !!customer.name && !!customer.phone && customer.phone.length >= 10
      case 1: return !!dates.event_date && !!dates.pickup_date && !!dates.return_date && dates.return_date >= dates.pickup_date
      case 2: return items.length > 0 && !!dates.pickup_date && dates.return_date >= dates.pickup_date
      case 3: return items.length > 0 && pricing.total_amount >= 0
      case 4: return !paymentError(payment.advance_amount, payment) && !paymentError(payment.deposit_amount, { method: payment.deposit_method ?? payment.method, reference: payment.deposit_reference, splits: payment.deposit_splits }) && !bookingNumberError(customBookingNumber) && Number.isFinite(payment.advance_amount) && payment.advance_amount >= 0 && payment.advance_amount <= pricing.total_amount && Number.isFinite(payment.deposit_amount) && payment.deposit_amount >= 0
      default: return true
    }
  }, [currentStep, customer, items, dates, pricing, payment, customBookingNumber])

  const handleNext = () => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    const numberError = bookingNumberError(customBookingNumber)
    if (numberError) { toast.error(numberError); return }
    setSaving(true)
    try {
      if (!staff || !activeBranch) throw new Error('Not authenticated')

      let idProofUrl = customer.id_proof_url
      if (customer.id_proof_file && staff?.business_id) {
        const { StorageService } = await import('@/lib/storage-service')
        idProofUrl = await StorageService.uploadCustomerID(staff.business_id, customer.id_proof_file)
      }

      await saveDraft()
      const result = await createNewBookingFlow({
        requestId: requestId.current,
        customBookingNumber: normalizeBookingNumber(customBookingNumber) || undefined,
        customer: { ...customer, id_proof_file: undefined, id_proof_url: idProofUrl },
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
      setCreatedBookingNumber(result.bookingNumber!)
      setCurrentStep(5) // Receipt step
      await clearDraft() // Remove saved draft on success
      toast.success(`Booking ${result.bookingNumber} created!`)
    } catch (err: any) {
      console.error('Booking creation error:', err)
      toast.error(err.message || 'Failed to create booking. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!draftReady) return <p className="text-sm text-muted-foreground">Checking for a saved booking draft…</p>

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/bookings')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-foreground">New Booking</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/bookings')}>
          <X className="w-4 h-4" />
        </Button>
      </div>

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
        <div>
          {currentStep === 0 && <CustomerStep customer={customer} setCustomer={setCustomer} />}
          {currentStep === 1 && <DatesStep dates={dates} setDates={setDates} />}
          {currentStep === 2 && <><ItemsStep items={items} setItems={setItems} dates={dates} setDates={setDates} /><BookingPreparation dates={dates} setDates={setDates} requestId={requestId.current} onUploadingChange={setUploadingCondition} /></>}
          {currentStep === 3 && <PricingStep items={items} setItems={setItems} />}
          {currentStep === 4 && <PaymentStep customBookingNumber={customBookingNumber} setCustomBookingNumber={setCustomBookingNumber} payment={payment} setPayment={setPayment} totalAmount={pricing.total_amount} />}
          {currentStep === 5 && <ReceiptStep onCreateAnother={onCreateAnother} bookingNumber={createdBookingNumber} bookingId={createdBookingId} customer={customer} items={items} dates={dates} pricing={pricing} payment={payment} />}
        </div>
      </Card>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0 || uploadingCondition}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {currentStep < 4 ? (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleNext} disabled={!canProceed() || uploadingCondition}>
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
