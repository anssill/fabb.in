import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const supabase = createClient()

export interface BookingFilters {
  branchId: string
  status?: string
  search?: string
  startDate?: string
  endDate?: string
}

export const fetchBookings = async (filters: BookingFilters & { offset: number }) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      customers (id, name, phone)
    `, { count: 'exact' })
    .eq('branch_id', filters.branchId)

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.search) {
    query = query.ilike('booking_id_display', `%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false })
  
  const limit = 20
  const from = filters.offset * limit
  const to = from + limit - 1

  const { data, error, count } = await query.range(from, to)

  if (error) throw error

  return {
    data,
    count,
    nextOffset: (data && data.length === limit) ? filters.offset + 1 : undefined,
  }
}

export const useBookings = (filters: BookingFilters) =>
  useInfiniteQuery({
    queryKey: ['bookings', filters],
    queryFn: ({ pageParam = 0 }) => fetchBookings({ ...filters, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0
  })

export const useBooking = (id: string) =>
  useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (*),
          booking_items (*, item:items(*), variant:item_variants(*)),
          booking_payments (*),
          booking_accessories (*),
          booking_timeline (*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  })

export const useTodaySchedule = (branchId: string) =>
  useQuery({
    queryKey: ['bookings', 'today', branchId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, pickup_date, return_date, booking_id_display,
          customers (name, phone),
          booking_items (item:items(name), quantity)
        `)
        .eq('branch_id', branchId)
        .or(`pickup_date.eq.${today},return_date.eq.${today}`)
        .not('status', 'in', '("cancelled","draft")')
      if (error) throw error
      return data
    },
    staleTime: 30_000
  })

export const useCalendarBookings = (branchId: string, startDate: string, endDate: string) =>
  useQuery({
    queryKey: ['calendar', 'bookings', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, pickup_date, return_date, booking_id_display,
          customer:customers(name),
          booking_items(item:items(id, name, category))
        `)
        .eq('branch_id', branchId)
        .gte('pickup_date', startDate)
        .lte('return_date', endDate)
        .not('status', 'in', '("cancelled","draft")')
      if (error) throw error
      return data
    }
  })
