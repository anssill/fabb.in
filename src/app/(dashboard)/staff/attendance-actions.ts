'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 1000); // return in meters
}

export async function getTodayAttendance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // We check if a record exists for today for this staff member
  const today = new Date().toISOString().split('T')[0]
  
  const { data: record, error } = await supabase
    .from('staff_attendance')
    .select('*')
    .eq('staff_id', user.id)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching attendance:', error)
  }

  return record || null
}

export async function clockIn(lat: number, lng: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get staff and branch data
  const { data: staff } = await supabase
    .from('staff')
    .select('business_id, branch_id, branches(lat, lng, gps_radius_metres)')
    .eq('id', user.id)
    .single()

  if (!staff || !staff.branch_id || !staff.branches) {
    throw new Error('No branch assigned to staff.')
  }

  // Handle branch potentially being an array or object
  const branchData: any = Array.isArray(staff.branches) ? staff.branches[0] : staff.branches

  // Calculate distance
  let distance = null
  let isValidLocation = null

  if (branchData.lat && branchData.lng) {
    distance = getDistanceFromLatLonInMeters(lat, lng, Number(branchData.lat), Number(branchData.lng))
    const radius = branchData.gps_radius_metres || 100
    isValidLocation = distance <= radius
  }

  const today = new Date().toISOString().split('T')[0]
  
  const { error } = await supabase
    .from('staff_attendance')
    .insert({
      staff_id: user.id,
      business_id: staff.business_id,
      branch_id: staff.branch_id,
      date: today,
      clock_in_at: new Date().toISOString(),
      clock_in_lat: lat,
      clock_in_lng: lng,
      distance_from_branch: distance,
      is_valid_location: isValidLocation
    })

  if (error) {
    if (error.code === '23505') throw new Error('Already clocked in today.')
    throw new Error(error.message)
  }

  revalidatePath('/')
  return { success: true }
}

export async function clockOut() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const today = new Date().toISOString().split('T')[0]
  
  // Get the active record
  const { data: record, error: recordErr } = await supabase
    .from('staff_attendance')
    .select('id, clock_in_at, clock_out_at')
    .eq('staff_id', user.id)
    .eq('date', today)
    .single()

  if (recordErr || !record) throw new Error('No active clock-in found for today.')
  
  if (record.clock_out_at) throw new Error('Already clocked out today.')

  const clockOutTime = new Date()
  const clockInTime = new Date(record.clock_in_at)
  
  // Calculate hours worked
  const diffMs = clockOutTime.getTime() - clockInTime.getTime()
  const hoursWorked = +(diffMs / (1000 * 60 * 60)).toFixed(2)

  const { error } = await supabase
    .from('staff_attendance')
    .update({
      clock_out_at: clockOutTime.toISOString(),
      hours_worked: hoursWorked
    })
    .eq('id', record.id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  return { success: true }
}
