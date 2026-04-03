import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { format } from 'date-fns'
import { writeAuditLog } from '@/lib/audit'

interface BookingRow {
  id: string
  status: string
  pickup_date: string
  return_date: string
  total_amount: number
  advance_paid: number
  deposit_collected: number
  created_at: string
  booking_id_display?: string
  customers: { name: string; phone: string; tier: string } | null
  staff: { name: string } | null
  [key: string]: unknown
}

export function useBookings(statusFilter?: string) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery<BookingRow[]>({
    queryKey: ['bookings', activeBranchId, statusFilter],
    queryFn: async (): Promise<BookingRow[]> => {
      if (!activeBranchId) return []

      let query = supabase
        .from('bookings')
        .select(`
          *,
          customers ( name, phone, tier ),
          staff:created_by ( name )
        `)
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as BookingRow[]
    },
    enabled: !!activeBranchId,
  })
}

export function useCreateBooking() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async (draft: Record<string, unknown>) => {
      const { data: userData } = await supabase.auth.getUser()
      const { data: staff } = await supabase
        .from('staff')
        .select('business_id')
        .eq('id', userData.user?.id)
        .single()

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          branch_id: activeBranchId,
          business_id: staff?.business_id,
          customer_id: draft.customer_id,
          items: draft.items,
          pickup_date: draft.pickup_date,
          return_date: draft.return_date,
          total_amount: draft.total_amount,
          deposit_amount: draft.deposit_amount,
          advance_paid: draft.advance_paid,
          payment_method: draft.payment_method,
          occasion: draft.occasion,
          source: draft.source,
          notes: draft.notes,
          status: 'confirmed',
          created_by: userData.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', activeBranchId] })
    },
  })
}

interface FullBookingDraft {
  customer_id: string
  items: Array<{
    id: string
    name: string
    sku: string
    category: string
    daily_rate: number
    sizes: Record<string, number>
  }>
  pickup_date: string
  return_date: string
  total_days: number
  total_amount: number
  deposit_amount: number
  payment_method_1: string
  payment_amount_1: number
  payment_method_2?: string
  payment_amount_2?: number
  occasion: string
  source: string
  notes: string
  price_override_amount?: number
  price_override_reason?: string
}

export function useCreateFullBooking() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async (draft: FullBookingDraft) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data: staff } = await supabase
        .from('staff')
        .select('business_id, branch_id, name')
        .eq('id', userData.user.id)
        .single()
      if (!staff) throw new Error('Staff not found')

      // Generate display ID: ECH-YYMMDD-NNN
      const dateStr = format(new Date(), 'yyMMdd')
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', activeBranchId)
        .gte('created_at', `${format(new Date(), 'yyyy-MM-dd')}T00:00:00`)
      const seq = String((count ?? 0) + 1).padStart(3, '0')
      const bookingIdDisplay = `ECH-${dateStr}-${seq}`

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          business_id: staff.business_id,
          branch_id: activeBranchId,
          customer_id: draft.customer_id,
          pickup_date: draft.pickup_date,
          return_date: draft.return_date,
          total_amount: draft.total_amount,
          deposit_amount: draft.deposit_amount,
          advance_paid: draft.payment_amount_1 + (draft.payment_amount_2 ?? 0),
          deposit_collected: 0,
          status: 'confirmed',
          booking_source: draft.source,
          occasion: draft.occasion,
          notes: draft.notes,
          price_override_amount: draft.price_override_amount ?? null,
          price_override_reason: draft.price_override_reason ?? null,
          booking_id_display: bookingIdDisplay,
          created_by: userData.user.id,
        })
        .select('id')
        .single()
      if (bookingError) throw bookingError

      // Insert booking_items
      const bookingItems: Record<string, unknown>[] = []
      for (const item of draft.items) {
        for (const [size, qty] of Object.entries(item.sizes)) {
          if (qty > 0) {
            bookingItems.push({
              business_id: staff.business_id,
              branch_id: activeBranchId,
              booking_id: booking.id,
              item_id: item.id,
              size,
              quantity: qty,
              daily_rate: item.daily_rate,
              subtotal: item.daily_rate * qty * draft.total_days,
            })
          }
        }
      }
      if (bookingItems.length > 0) {
        const { error } = await supabase.from('booking_items').insert(bookingItems)
        if (error) throw error
      }

      // Insert payments
      const payments: Record<string, unknown>[] = []
      if (draft.payment_amount_1 > 0) {
        payments.push({
          business_id: staff.business_id,
          branch_id: activeBranchId,
          booking_id: booking.id,
          type: 'advance',
          amount: draft.payment_amount_1,
          method: draft.payment_method_1,
          staff_id: userData.user.id,
        })
      }
      if (draft.payment_method_2 && draft.payment_amount_2 && draft.payment_amount_2 > 0) {
        payments.push({
          business_id: staff.business_id,
          branch_id: activeBranchId,
          booking_id: booking.id,
          type: 'advance',
          amount: draft.payment_amount_2,
          method: draft.payment_method_2,
          staff_id: userData.user.id,
        })
      }
      if (payments.length > 0) {
        const { error } = await supabase.from('booking_payments').insert(payments)
        if (error) throw error
      }

      // Insert timeline entry
      await supabase.from('booking_timeline').insert({
        business_id: staff.business_id,
        branch_id: activeBranchId,
        booking_id: booking.id,
        event_type: 'booking_created',
        description: `Booking created by ${staff.name ?? 'staff'}`,
        staff_name: staff.name,
      })

      // Audit log (non-fatal)
      await writeAuditLog({
        action: 'CREATE',
        tableName: 'bookings',
        recordId: booking.id,
        newValue: { booking_id_display: bookingIdDisplay },
        branchId: activeBranchId,
        businessId: staff.business_id,
      })
      
      // Trigger Notion sync via Edge Function (non-fatal)
      supabase.functions.invoke('notion-sync', {
        body: { type: 'booking_created', booking_id: booking.id }
      }).catch(err => console.error('Notion sync failed:', err))

      return { id: booking.id, booking_id_display: bookingIdDisplay }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
