import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────
export interface DraftCustomer {
  id?: string
  name: string
  phone: string
  email?: string
  tier?: string
  risk_score?: string
}

export interface DraftItem {
  id: string
  sku: string
  name: string
  category: string
  price: number
  cover_photo?: string
  sizes: Record<string, number> // e.g. { M: 2, L: 1 }
}

export interface DraftDates {
  pickup_date: string    // ISO string
  return_date: string    // ISO string
  total_days: number
}

export interface DraftPricing {
  subtotal: number
  override_price?: number
  override_reason?: string
  deposit_amount: number
  total_amount: number
}

export interface DraftPayment {
  method_1: 'Cash' | 'UPI' | 'Bank Transfer' | 'Store Credit'
  amount_1: number
  method_2?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Store Credit'
  amount_2?: number
  advance_amount: number
  deposit_amount: number
}

// ── Store ──────────────────────────────────────────────────────────
interface BookingDraftState {
  currentStep: number
  customer: DraftCustomer | null
  items: DraftItem[]
  dates: DraftDates | null
  pricing: DraftPricing | null
  payment: DraftPayment | null
  occasion: string
  source: 'Walk-in' | 'WhatsApp' | 'Referral' | 'Phone call'
  notes: string

  // Actions
  setStep: (step: number) => void
  setCustomer: (customer: DraftCustomer) => void
  addItem: (item: DraftItem) => void
  removeItem: (itemId: string) => void
  updateItemSizes: (itemId: string, sizes: Record<string, number>) => void
  setDates: (dates: DraftDates) => void
  setPricing: (pricing: DraftPricing) => void
  setPayment: (payment: DraftPayment) => void
  setOccasion: (occasion: string) => void
  setSource: (source: BookingDraftState['source']) => void
  setNotes: (notes: string) => void
  resetDraft: () => void
}

const initialState = {
  currentStep: 1,
  customer: null,
  items: [],
  dates: null,
  pricing: null,
  payment: null,
  occasion: '',
  source: 'Walk-in' as const,
  notes: '',
}

export const useBookingDraftStore = create<BookingDraftState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setCustomer: (customer) => set({ customer }),

      addItem: (item) =>
        set((state) => ({
          items: state.items.some((i) => i.id === item.id)
            ? state.items
            : [...state.items, item],
        })),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),

      updateItemSizes: (itemId, sizes) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, sizes } : i
          ),
        })),

      setDates: (dates) => set({ dates }),
      setPricing: (pricing) => set({ pricing }),
      setPayment: (payment) => set({ payment }),
      setOccasion: (occasion) => set({ occasion }),
      setSource: (source) => set({ source }),
      setNotes: (notes) => set({ notes }),

      resetDraft: () => set(initialState),
    }),
    {
      name: 'echo-booking-draft',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
