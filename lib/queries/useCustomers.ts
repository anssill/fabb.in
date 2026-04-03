import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

export function useCustomers() {
  const supabase = createClient()
  const activeBranchId = useUserStore(state => state.activeBranchId)

  return useQuery({
    queryKey: ['customers', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId
  })
}

export function useCustomer(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          family_group:family_groups(*),
          notes:customer_notes(*),
          groups:customer_group_memberships(group:customer_groups(*))
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

export function useCustomerBookings(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer-bookings', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!id
  })
}

export function useCustomerPayments(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer-payments', id],
    queryFn: async () => {
      if (!id) return []
      // We need to find all bookings for the customer first.
      
      // Corrected logic: find payments for all bookings of this customer
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_id', id)
      
      if (!bookings?.length) return []

      const { data: payments, error: pError } = await supabase
        .from('booking_payments')
        .select(`
          *,
          booking:bookings(id_display)
        `)
        .in('booking_id', bookings.map(b => b.id))
        .order('timestamp', { ascending: false })

      if (pError) throw pError
      return payments || []
    },
    enabled: !!id
  })
}

export function useCustomerActivity(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer-activity', id],
    queryFn: async () => {
      if (!id) return []
      
      // 1. Fetch Bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', id)
      
      // 2. Fetch Notes
      const { data: notes } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', id)
      
      // 3. Fetch Payments
      const bookingIds = bookings?.map(b => b.id) || []
      const { data: payments } = bookingIds.length > 0 
        ? await supabase.from('booking_payments').select('*, booking:bookings(id_display)').in('booking_id', bookingIds)
        : { data: [] }

      // 4. Combine and normalize
      const activity = [
        ...(bookings || []).map(b => ({
          id: `booking-${b.id}`,
          type: 'booking',
          date: b.created_at,
          title: `New Booking: ${b.id_display || b.id.slice(0,8)}`,
          description: `Total amount: ₹${b.total_amount}`,
          status: b.status,
          link: `/bookings/${b.id}`
        })),
        ...(notes || []).map(n => ({
          id: `note-${n.id}`,
          type: n.is_pinned ? 'pinned_note' : 'note',
          date: n.created_at,
          title: n.is_pinned ? 'Pinned Note' : 'Staff Note',
          description: n.content,
          author: n.created_by
        })),
        ...(payments || []).map(p => ({
          id: `payment-${p.id}`,
          type: 'payment',
          date: p.timestamp,
          title: `Payment: ₹${p.amount}`,
          description: `${p.type} via ${p.method} for booking ${p.booking?.id_display || 'N/A'}`,
          status: p.is_voided ? 'voided' : 'confirmed'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return activity
    },
    enabled: !!id
  })
}

export function useCustomerOutfitHistory(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customer-outfit-history', id],
    queryFn: async () => {
      if (!id) return []

      const { data, error } = await supabase
        .from('booking_items')
        .select(`
          id,
          size,
          quantity,
          condition_after,
          bookings!inner(id, created_at, status, id_display),
          item:items(id, name, sku, category, image_url)
        `)
        .eq('bookings.customer_id', id)
        .order('bookings(created_at)', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!id
  })
}

export function useCreateCustomer() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore(state => state.activeBranchId)

  return useMutation({
    mutationFn: async (customer: { name: string; phone: string; email?: string }) => {
      if (!activeBranchId) throw new Error('No active branch selected')

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          branch_id: activeBranchId,
          tier: 'bronze',
          risk_level: 'low',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', activeBranchId] })
    }
  })
}

export function useRecalculateRiskScore() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerId: string) => {
      // Logic for calculating risk score: 
      // 1. Fetch late returns
      // 2. Fetch damages
      // 3. Fetch cancellations
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, id')
        .eq('customer_id', customerId)
      
      const { data: items } = await supabase
        .from('booking_items')
        .select('condition_after')
        .in('booking_id', bookings?.map(b => b.id) || [])
      
      const lateReturns = bookings?.filter(b => b.status === 'overdue').length || 0
      const cancellations = bookings?.filter(b => b.status === 'cancelled').length || 0
      const damages = items?.filter(i => ['damaged', 'missing'].includes(i.condition_after || '')).length || 0

      const score = Math.min(lateReturns * 25 + damages * 30 + cancellations * 15, 100)
      const level = score <= 25 ? 'low' : score <= 60 ? 'medium' : 'high'

      const { error } = await supabase
        .from('customers')
        .update({ risk_score: score, risk_level: level })
        .eq('id', customerId)

      if (error) throw error
      return { score, level }
    },
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
    }
  })
}

export function useUpdateCustomerTier() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { data: customer } = await supabase
        .from('customers')
        .select('total_spend, tier, branch_id')
        .eq('id', customerId)
        .single()

      if (!customer) throw new Error('Customer not found')

      const { data: branch } = await supabase
        .from('branches')
        .select('settings')
        .eq('id', customer.branch_id)
        .single()

      const settings = branch?.settings as { tier_thresholds?: { silver: number; gold: number; platinum: number } } | null
      const thresholds = settings?.tier_thresholds || {
        silver: 5000, gold: 15000, platinum: 30000
      }

      let newTier = 'bronze'
      if (customer.total_spend >= thresholds.platinum) newTier = 'platinum'
      else if (customer.total_spend >= thresholds.gold) newTier = 'gold'
      else if (customer.total_spend >= thresholds.silver) newTier = 'silver'

      if (newTier !== customer.tier) {
        const { error } = await supabase
          .from('customers')
          .update({ tier: newTier })
          .eq('id', customerId)

        if (error) throw error
        
        // Notify manager (simplified here, in real app would call createNotification)
        await supabase.from('notifications').insert({
          branch_id: customer.branch_id,
          type: 'tier_upgrade',
          title: `Customer Tier Upgraded`,
          body: `Customer upgraded to ${newTier.toUpperCase()}`
        })
      }
      
      return newTier
    },
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
    }
  })
}

export function useAddCustomerNote() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, content, staffId }: { customerId: string; content: string; staffId?: string }) => {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          content,
          created_by: staffId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
    }
  })
}

export function usePinCustomerNote() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string; isPinned: boolean; customerId: string }) => {
      const { error } = await supabase
        .from('customer_notes')
        .update({ is_pinned: isPinned })
        .eq('id', noteId)

      if (error) throw error
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
    }
  })
}

export function useUpdateAadhaarStatus() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, url, side }: { customerId: string; url: string; side: 'front' | 'back' }) => {
      const updates: { aadhaar_front_url?: string; aadhaar_back_url?: string } = {}
      if (side === 'front') updates.aadhaar_front_url = url
      else updates.aadhaar_back_url = url

      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)

      if (error) throw error
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
    }
  })
}

export function useSettleDebt() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, amount, staffId }: { customerId: string; amount: number; staffId: string }) => {
      // 1. Fetch current customer debt
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('debt_amount, branch_id')
        .eq('id', customerId)
        .single()

      if (fetchError) throw fetchError
      if (!customer) throw new Error('Customer not found')

      const newDebt = Math.max((customer.debt_amount || 0) - amount, 0)

      // 2. Update customer debt
      const { error: updateError } = await supabase
        .from('customers')
        .update({ debt_amount: newDebt })
        .eq('id', customerId)

      if (updateError) throw updateError

      // 3. Log as a payment for auditing (simplified)
      await supabase.from('booking_payments').insert({
        type: 'debt_settlement',
        amount,
        method: 'cash', // Default to cash for debt settlement, could be passed
        staff_id: staffId,
        is_voided: false,
      })

      return newDebt
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
    }
  })
}
