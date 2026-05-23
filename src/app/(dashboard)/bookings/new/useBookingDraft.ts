'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BookingCustomer, BookingItem, BookingDates, BookingPricing, BookingPayment } from './page'

interface DraftState {
  currentStep: number
  customer: BookingCustomer
  items: BookingItem[]
  dates: BookingDates
  pricing: BookingPricing
  payment: BookingPayment
}

interface UseBookingDraftOptions {
  businessId?: string
  branchId?: string
  staffId?: string
  enabled: boolean
}

export function useBookingDraft(state: DraftState, options: UseBookingDraftOptions) {
  const { businessId, branchId, staffId, enabled } = options
  const draftIdRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  const saveDraft = useCallback(async () => {
    if (!enabled || !businessId || !branchId || !staffId) return

    try {
      const draftData = {
        business_id: businessId,
        branch_id: branchId,
        staff_id: staffId,
        draft_data: state,
        updated_at: new Date().toISOString(),
      }

      if (draftIdRef.current) {
        await supabase
          .from('booking_drafts')
          .update({ draft_data: state, updated_at: new Date().toISOString() })
          .eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('booking_drafts')
          .insert(draftData)
          .select('id')
          .single()
        if (data) draftIdRef.current = data.id
      }
    } catch {
      // Non-critical — silent fail
    }
  }, [enabled, businessId, branchId, staffId, state, supabase])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!enabled) return
    timerRef.current = setInterval(saveDraft, 30_000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [enabled, saveDraft])

  // Clear draft on unmount if at receipt step (completed)
  const clearDraft = useCallback(async () => {
    if (draftIdRef.current) {
      await supabase.from('booking_drafts').delete().eq('id', draftIdRef.current)
      draftIdRef.current = null
    }
  }, [supabase])

  // Load existing draft
  const loadDraft = useCallback(async (): Promise<DraftState | null> => {
    if (!businessId || !branchId || !staffId) return null
    try {
      const { data } = await supabase
        .from('booking_drafts')
        .select('id, draft_data')
        .eq('business_id', businessId)
        .eq('branch_id', branchId)
        .eq('staff_id', staffId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        draftIdRef.current = data.id
        return data.draft_data as DraftState
      }
    } catch {
      // No draft found
    }
    return null
  }, [businessId, branchId, staffId, supabase])

  return { saveDraft, clearDraft, loadDraft }
}
