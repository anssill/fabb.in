import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { format } from 'date-fns'

export function useStaffList() {
  const supabase = createClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useQuery({
    queryKey: ['staff-list', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('role', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId
  })
}

export function useAttendance(date: string = format(new Date(), 'yyyy-MM-dd')) {
  const supabase = createClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useQuery({
    queryKey: ['attendance', activeBranchId, date],
    queryFn: async () => {
      if (!activeBranchId) return []
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*, staff:staff(name, role)')
        .eq('branch_id', activeBranchId)
        .eq('date', date)

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId
  })
}

export function useClockIn() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile: user, activeBranchId } = useUserStore()

  return useMutation({
    mutationFn: async (coords: { lat: number; lng: number }) => {
      if (!user || !activeBranchId) throw new Error('Missing Auth or Branch')

      const { data, error } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id: user.id,
          branch_id: activeBranchId,
          business_id: (await supabase.from('branches').select('business_id').eq('id', activeBranchId).single()).data?.business_id,
          clock_in: new Date().toISOString(),
          clock_in_lat: coords.lat,
          clock_in_lng: coords.lng,
          date: format(new Date(), 'yyyy-MM-dd'),
          is_valid_location: true // Simplified: in real app, check against branch coords
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    }
  })
}

export function useClockOut() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile: user } = useUserStore()

  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const { profile: user, activeBranchId } = useUserStore.getState()
      if (!activeBranchId) throw new Error('No active branch')

      const { data, error } = await supabase
        .from('staff_attendance')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', attendanceId)
        .eq('branch_id', activeBranchId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    }
  })
}

export function usePendingStaffApprovals() {
  const supabase = createClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useQuery({
    queryKey: ['pending-approvals', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('branch_id', activeBranchId)
        .eq('status', 'pending')

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId
  })
}

export function useApproveStaff() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((state) => state.activeBranchId)

  return useMutation({
    mutationFn: async (staffId: string) => {
      if (!activeBranchId) throw new Error('No active branch')
      const { error } = await supabase
        .from('staff')
        .update({ status: 'approved' })
        .eq('id', staffId)
        .eq('branch_id', activeBranchId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', activeBranchId] })
      queryClient.invalidateQueries({ queryKey: ['staff-list', activeBranchId] })
    }
  })
}
