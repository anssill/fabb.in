import { create } from 'zustand'

export interface Customer {
  id: string
  branch_id: string
  business_id: string
  name: string
  phone: string
  email: string | null
  aadhaar_front_url: string | null
  aadhaar_back_url: string | null
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  blacklist_level: 0 | 1 | 2 | 3
  blacklist_reason: string | null
  blacklisted_by: string | null
  blacklisted_at: string | null
  vip_flag: boolean
  vip_set_by: string | null
  loyalty_points: number
  debt_amount: number
  family_group_id: string | null
  total_spend: number
  total_bookings: number
  avg_booking_value: number
  created_by: string | null
  created_at: string
}

interface CustomerStore {
  selectedCustomer: Customer | null
  setSelectedCustomer: (c: Customer | null) => void
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  selectedCustomer: null,
  setSelectedCustomer: (c) => set({ selectedCustomer: c }),
}))
