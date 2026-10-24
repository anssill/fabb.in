'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { BookingCustomer, BookingItem, BookingDates, BookingPricing, BookingPayment } from './page'

export interface DraftState {
  currentStep: number
  customer: BookingCustomer
  items: BookingItem[]
  dates: BookingDates
  pricing: BookingPricing
  payment: BookingPayment
  customBookingNumber?: string
  requestId?: string
}

interface UseBookingDraftOptions {
  businessId?: string
  branchId?: string
  staffId?: string
  enabled: boolean
  onRestore: (draft: DraftState) => void
}

export function useBookingDraft(state: DraftState, options: UseBookingDraftOptions) {
  const { businessId, branchId, staffId, enabled, onRestore } = options
  const [supabase] = useState(createClient)
  const [ready, setReady] = useState(false)
  const draftId = useRef<string | null>(null)
  const pending = useRef<Promise<void>>(Promise.resolve())
  const completed = useRef(false)

  useEffect(() => {
    if (!businessId || !branchId || !staffId) return
    let cancelled = false
    supabase.from('booking_drafts').select('id, draft_data')
      .eq('business_id', businessId).eq('branch_id', branchId).eq('staff_id', staffId)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) toast.error('Could not restore your booking draft')
        else if (data) {
          draftId.current = data.id
          const draft = data.draft_data as DraftState
          if (draft.customer && Array.isArray(draft.items) && draft.dates && draft.payment && draft.currentStep < 5) onRestore(draft)
        }
        setReady(true)
      })
    return () => { cancelled = true }
  }, [businessId, branchId, staffId, supabase, onRestore])

  const saveDraft = useCallback(() => {
    if (!ready || !enabled || !businessId || !branchId || !staffId || completed.current) return pending.current
    if (!state.customer.name && !state.customer.phone && !state.items.length && !state.customBookingNumber && !state.dates.pickup_date) return pending.current
    // Serialize autosaves so slow inserts cannot create competing drafts.
    pending.current = pending.current.then(async () => {
      if (completed.current) return
      const data = { ...state, customer: { ...state.customer, id_proof_file: undefined } }
      if (draftId.current) {
        const { error } = await supabase.from('booking_drafts').update({ draft_data: data, updated_at: new Date().toISOString() })
          .eq('id', draftId.current).eq('business_id', businessId).eq('branch_id', branchId).eq('staff_id', staffId)
        if (error) throw error
      } else {
        const { data: row, error } = await supabase.from('booking_drafts').insert({
          business_id: businessId, branch_id: branchId, staff_id: staffId, draft_data: data, updated_at: new Date().toISOString(),
        }).select('id').single()
        if (error) throw error
        draftId.current = row.id
      }
    }).catch(() => { toast.error('Could not save your booking draft') })
    return pending.current
  }, [ready, enabled, businessId, branchId, staffId, state, supabase])

  useEffect(() => {
    if (!ready || !enabled) return
    const timer = setTimeout(saveDraft, 750)
    return () => clearTimeout(timer)
  }, [ready, enabled, saveDraft])

  const clearDraft = useCallback(async () => {
    completed.current = true
    await pending.current
    if (draftId.current && businessId && branchId && staffId) {
      const { error } = await supabase.from('booking_drafts').delete()
        .eq('id', draftId.current).eq('business_id', businessId).eq('branch_id', branchId).eq('staff_id', staffId)
      if (error) toast.error('Booking created, but its saved draft could not be cleared')
      else draftId.current = null
    }
  }, [supabase, businessId, branchId, staffId])

  return { saveDraft, clearDraft, ready }
}
