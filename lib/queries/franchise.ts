'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Business {
  id: string
  name: string
  subdomain: string
  plan: 'basic' | 'premium'
  status: 'active' | 'suspended'
  created_at: string
}

export interface Branch {
  id: string
  business_id: string
  name: string
  prefix: string
  location?: string
  gst_number?: string
  contact?: string
  created_at: string
}

export function useBusinesses() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return (data || []) as Business[]
    }
  })
}

export function useBranches(businessId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['branches', businessId],
    queryFn: async () => {
      let query = supabase.from('branches').select('*')
      if (businessId) query = query.eq('business_id', businessId)
      
      const { data, error } = await query.order('name', { ascending: true })
      if (error) throw error
      return (data || []) as Branch[]
    }
  })
}

export function useFranchiseStats() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['franchise-stats'],
    queryFn: async () => {
      // Aggregate stats for super_admin
      const { data: businesses } = await supabase.from('businesses').select('id')
      const { data: branches } = await supabase.from('branches').select('id')
      const { data: staff } = await supabase.from('staff').select('id')
      const { data: revenue } = await supabase.from('booking_payments').select('amount').eq('is_voided', false)
      
      return {
        totalBusinesses: businesses?.length || 0,
        totalBranches: branches?.length || 0,
        totalStaff: staff?.length || 0,
        totalRevenue: revenue?.reduce((acc, r) => acc + r.amount, 0) || 0
      }
    }
  })
}
