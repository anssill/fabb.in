'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

// ── Types ──────────────────────────────────────────────────────────
export interface StaffMember {
  id: string
  business_id: string
  branch_id: string
  name: string
  role: 'super_admin' | 'manager' | 'floor_staff' | 'auditor' | 'custom'
  status: 'pending' | 'approved' | 'suspended' | 'rejected'
  pin_code: string | null
  created_at: string
}

export interface AttendanceRecord {
  id: string
  staff_id: string
  branch_id: string
  clock_in: string | null
  clock_out: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  date: string
  is_valid_location: boolean
}

export interface PerformanceTarget {
  id: string
  staff_id: string
  branch_id: string
  month: string
  revenue_target: number | null
  booking_count_target: number | null
  created_by: string | null
}

// ── Staff list ─────────────────────────────────────────────────────
export function useStaffList() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['staff-list', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as StaffMember[]
    },
    enabled: !!activeBranchId,
  })
}

// ── Staff attendance ───────────────────────────────────────────────
export function useStaffAttendance(staffId: string, month?: Date) {
  const supabase = createClient()
  const now = month || new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`

  return useQuery({
    queryKey: ['staff-attendance', staffId, startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staffId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false })

      if (error) throw error
      return (data || []) as AttendanceRecord[]
    },
    enabled: !!staffId,
  })
}

// ── Staff performance targets ──────────────────────────────────────
export function useStaffPerformanceTargets(staffId: string, month?: Date) {
  const supabase = createClient()
  const now = month || new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  return useQuery({
    queryKey: ['staff-targets', staffId, monthStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_performance_targets')
        .select('*')
        .eq('staff_id', staffId)
        .eq('month', monthStr)
        .maybeSingle()

      if (error) throw error
      return data as PerformanceTarget | null
    },
    enabled: !!staffId,
  })
}

// ── GPS Clock-in ───────────────────────────────────────────────────
export function useClockIn() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      staff_id: string
      branch_id: string
      business_id: string
      lat: number
      lng: number
      is_valid_location: boolean
    }) => {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id: payload.staff_id,
          branch_id: payload.branch_id,
          business_id: payload.business_id,
          clock_in: new Date().toISOString(),
          clock_in_lat: payload.lat,
          clock_in_lng: payload.lng,
          date: today,
          is_valid_location: payload.is_valid_location,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-attendance', variables.staff_id] })
    },
  })
}

// ── Clock-out ──────────────────────────────────────────────────────
export function useClockOut() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase
        .from('staff_attendance')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', attendanceId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-attendance', data.staff_id] })
    },
  })
}

// ── Set performance target ─────────────────────────────────────────
export function useSetPerformanceTarget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      staff_id: string
      branch_id: string
      business_id: string
      month: string
      revenue_target: number
      booking_count_target: number
      created_by: string
    }) => {
      const { data, error } = await supabase
        .from('staff_performance_targets')
        .upsert(payload, { onConflict: 'staff_id,month' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-targets', variables.staff_id] })
    },
  })
}
