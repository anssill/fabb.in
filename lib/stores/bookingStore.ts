import { create } from 'zustand'

export type PaymentMethod = 'cash' | 'upi' | 'bank' | 'store_credit'

// Since full types might not be defined yet, we'll use placeholder generic types
// They should map to the Supabase schemas later.
export interface Customer {
  id: string
  name: string
  phone: string
  tier: string
  risk_score: 'Low' | 'Medium' | 'High'
}

export interface Item {
  id: string
  name: string
  sku: string
  category: string
  daily_rate: number
  photo_url?: string
}

export interface SelectedItem {
  item: Item
  variantId: string
  size: string
  quantity: number
  availableCount: number
}

export interface BookingStepData {
  customer: Customer | null
  selectedItems: SelectedItem[]
  pickupDate: Date | null
  returnDate: Date | null
  pricing: {
    total: number
    override: number | null
    overrideReason: string | null
  }
  payment: {
    advance: number
    deposit: number
    method1: PaymentMethod
    method2: PaymentMethod | null
    amount1: number
    amount2: number
  }
}

export interface BookingStore {
  currentStep: number
  stepData: BookingStepData
  draftId: string | null
  
  setStep: (step: number) => void
  updateStepData: (data: Partial<BookingStepData>) => void
  addItem: (item: SelectedItem) => void
  removeItem: (itemId: string, variantId: string, size: string) => void
  updateQuantity: (itemId: string, variantId: string, size: string, qty: number) => void
  clearBooking: () => void
  setDraftId: (id: string | null) => void
}

const initialStepData: BookingStepData = {
  customer: null,
  selectedItems: [],
  pickupDate: null,
  returnDate: null,
  pricing: {
    total: 0,
    override: null,
    overrideReason: null,
  },
  payment: {
    advance: 0,
    deposit: 0,
    method1: 'cash',
    method2: null,
    amount1: 0,
    amount2: 0,
  },
}

export const useBookingStore = create<BookingStore>((set) => ({
  currentStep: 1,
  stepData: initialStepData,
  draftId: null,

  setStep: (step: number) => set({ currentStep: step }),

  updateStepData: (data: Partial<BookingStepData>) => set((state) => ({
    stepData: { ...state.stepData, ...data }
  })),

  addItem: (item: SelectedItem) => set((state) => {
    // Check if variant/size is already selected
    const existingIndex = state.stepData.selectedItems.findIndex(
      (si) => si.item.id === item.item.id && si.variantId === item.variantId && si.size === item.size
    )

    const newSelectedItems = [...state.stepData.selectedItems]
    if (existingIndex > -1) {
      // If it exists, but the user is "adding", we might just update quantity or ignore if UI handles it.
      // Usually UI uses updateQuantity for this.
      newSelectedItems[existingIndex].quantity = Math.min(
        newSelectedItems[existingIndex].quantity + item.quantity,
        item.availableCount
      )
    } else {
      newSelectedItems.push(item)
    }

    return { stepData: { ...state.stepData, selectedItems: newSelectedItems } }
  }),

  removeItem: (itemId: string, variantId: string, size: string) => set((state) => ({
    stepData: {
      ...state.stepData,
      selectedItems: state.stepData.selectedItems.filter(
        (si) => !(si.item.id === itemId && si.variantId === variantId && si.size === size)
      )
    }
  })),

  updateQuantity: (itemId: string, variantId: string, size: string, qty: number) => set((state) => {
    const newSelectedItems = state.stepData.selectedItems.map((si) => {
      if (si.item.id === itemId && si.variantId === variantId && si.size === size) {
        return { ...si, quantity: Math.max(0, Math.min(qty, si.availableCount)) }
      }
      return si
    })
    
    // Auto-remove if quantity falls to 0
    return {
      stepData: {
        ...state.stepData,
        selectedItems: newSelectedItems.filter(si => si.quantity > 0)
      }
    }
  }),

  clearBooking: () => set({
    currentStep: 1,
    stepData: initialStepData,
    draftId: null
  }),

  setDraftId: (id: string | null) => set({ draftId: id })
}))
