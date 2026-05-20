'use server'

import { createClient } from '@/lib/supabase/server'
import {
  startOfDay, subDays, format, eachDayOfInterval, isSameDay,
  startOfMonth, endOfMonth, subMonths, endOfDay
} from 'date-fns'

function formatError(error: any): Error {
  return new Error(error?.message || error?.code || 'Database error')
}

export type Period = 'today' | '7d' | '30d' | 'last_month' | '90d'

function getPeriodDates(period: Period): { startDate: Date; endDate: Date; label: string } {
  const now = new Date()
  switch (period) {
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now), label: 'Today' }
    case '7d':
      return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now), label: 'Last 7 Days' }
    case '30d':
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now), label: 'Last 30 Days' }
    case 'last_month': {
      const lm = subMonths(now, 1)
      return { startDate: startOfMonth(lm), endDate: endOfMonth(lm), label: 'Last Month' }
    }
    case '90d':
      return { startDate: startOfDay(subDays(now, 89)), endDate: endOfDay(now), label: 'Last 3 Months' }
    default:
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now), label: 'Last 30 Days' }
  }
}

export async function getRevenueStats(period: Period = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { startDate, endDate } = getPeriodDates(period)

  const { data: payments, error: pError } = await supabase
    .from('booking_payments')
    .select('amount, created_at, method, type')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('is_voided', false)
    .order('created_at', { ascending: true })

  if (pError) throw pError

  const { data: expenses, error: eError } = await supabase
    .from('expenses')
    .select('amount, category, expense_date')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0])

  if (eError) throw eError

  const { data: bookingsSource } = await supabase
    .from('bookings')
    .select('booking_source')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const interval = eachDayOfInterval({ start: startDate, end: endDate })

  const dailyData = interval.map(day => {
    const dayPayments = payments?.filter(p => isSameDay(new Date(p.created_at), day)) || []
    const dayExpenses = expenses?.filter(e => e.expense_date && isSameDay(new Date(e.expense_date), day)) || []
    const revenue = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const expense = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    return { date: format(day, 'dd MMM'), revenue, expense, profit: revenue - expense }
  })

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  const methods = ['cash', 'upi', 'bank_transfer', 'card']
  const methodDistribution = methods.map(method => ({
    name: method === 'bank_transfer' ? 'Bank Transfer' : method.charAt(0).toUpperCase() + method.slice(1),
    value: payments?.filter(p => p.method === method).reduce((sum, p) => sum + Number(p.amount), 0) || 0
  })).filter(m => m.value > 0)

  return {
    dailyData,
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      paymentCount: payments?.length || 0,
      cashTotal: payments?.filter(p => p.method === 'cash').reduce((s, p) => s + Number(p.amount), 0) || 0,
      upiTotal: payments?.filter(p => p.method === 'upi').reduce((s, p) => s + Number(p.amount), 0) || 0,
      bankTotal: payments?.filter(p => p.method === 'bank_transfer').reduce((s, p) => s + Number(p.amount), 0) || 0,
    },
    methodDistribution,
    sourceDistribution: [
      { name: 'Walk-in', value: bookingsSource?.filter(b => b.booking_source === 'walk_in').length || 0 },
      { name: 'Phone', value: bookingsSource?.filter(b => b.booking_source === 'phone').length || 0 },
      { name: 'WhatsApp', value: bookingsSource?.filter(b => b.booking_source === 'whatsapp').length || 0 },
      { name: 'Referral', value: bookingsSource?.filter(b => b.booking_source === 'referral').length || 0 },
      { name: 'Repeat', value: bookingsSource?.filter(b => b.booking_source === 'repeat').length || 0 },
    ].filter(s => s.value > 0)
  }
}

export async function getOccasionStats(period: Period = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { startDate, endDate } = getPeriodDates(period)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('occasion')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (!bookings) return []

  const counts: Record<string, number> = {}
  for (const b of bookings) {
    const occ = b.occasion || 'Other'
    const label = occ.charAt(0).toUpperCase() + occ.slice(1).replace(/_/g, ' ')
    counts[label] = (counts[label] || 0) + 1
  }

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

export async function getStaffPerformance(period: Period = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: myStaff } = await supabase.from('staff').select('business_id, branch_id, role').eq('id', user.id).single()
  if (!myStaff) throw new Error('Staff record not found')
  if (!['owner', 'manager', 'super_admin'].includes(myStaff.role)) return []

  const { startDate, endDate } = getPeriodDates(period)

  const { data: teamMembers } = await supabase
    .from('staff')
    .select('id, name, role')
    .eq('business_id', myStaff.business_id)
    .eq('branch_id', myStaff.branch_id)
    .in('status', ['approved'])

  if (!teamMembers) return []

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, created_by, total_amount')
    .eq('business_id', myStaff.business_id)
    .eq('branch_id', myStaff.branch_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const { data: payments } = await supabase
    .from('booking_payments')
    .select('amount, collected_by')
    .eq('business_id', myStaff.business_id)
    .eq('branch_id', myStaff.branch_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('is_voided', false)

  return teamMembers.map(member => {
    const memberBookings = bookings?.filter(b => b.created_by === member.id) || []
    const memberPayments = payments?.filter(p => p.collected_by === member.id) || []
    const revenueHandled = memberPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    return {
      id: member.id,
      name: member.name,
      role: member.role,
      bookingsCreated: memberBookings.length,
      revenueHandled,
    }
  }).filter(m => m.bookingsCreated > 0 || m.revenueHandled > 0)
    .sort((a, b) => b.revenueHandled - a.revenueHandled)
}

export async function getPLStatement(period: Period = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id, role').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')
  if (!['owner', 'super_admin'].includes(staff.role)) return null

  const { startDate, endDate } = getPeriodDates(period)

  const { data: payments } = await supabase
    .from('booking_payments')
    .select('amount, type')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('is_voided', false)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0])

  const { data: deposits } = await supabase
    .from('booking_payments')
    .select('amount')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .eq('type', 'deposit')
    .eq('is_voided', false)

  const rentalIncome = payments?.filter(p => !['deposit', 'deposit_refund', 'refund', 'penalty'].includes(p.type))
    .reduce((s, p) => s + Number(p.amount), 0) || 0
  const penalties = payments?.filter(p => p.type === 'penalty')
    .reduce((s, p) => s + Number(p.amount), 0) || 0
  const refunds = payments?.filter(p => ['deposit_refund', 'refund'].includes(p.type))
    .reduce((s, p) => s + Number(p.amount), 0) || 0
  const totalRevenue = rentalIncome + penalties
  const depositsHeld = deposits?.reduce((s, p) => s + Number(p.amount), 0) || 0

  const expenseByCategory: Record<string, number> = {}
  for (const e of expenses || []) {
    const cat = e.category || 'Other'
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount)
  }
  const totalExpenses = Object.values(expenseByCategory).reduce((s, v) => s + v, 0)

  return {
    rentalIncome,
    penalties,
    refunds,
    totalRevenue,
    expenseByCategory,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    depositsHeld,
  }
}

export async function getBookingStats(period: Period = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { startDate, endDate } = getPeriodDates(period)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, total_amount, status, customer_id')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (!bookings) return { total: 0, newCustomers: 0, repeatCustomers: 0, avgValue: 0, cancellationRate: 0 }

  const total = bookings.length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length
  const avgValue = total > 0 ? bookings.reduce((s, b) => s + Number(b.total_amount), 0) / total : 0
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0

  const customerIds = [...new Set(bookings.map(b => b.customer_id))]
  const { data: prevBookings } = await supabase
    .from('bookings')
    .select('customer_id')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .lt('created_at', startDate.toISOString())
    .in('customer_id', customerIds)

  const prevCustomerIds = new Set(prevBookings?.map(b => b.customer_id) || [])
  const newCustomers = customerIds.filter(id => !prevCustomerIds.has(id)).length
  const repeatCustomers = customerIds.filter(id => prevCustomerIds.has(id)).length

  return {
    total,
    newCustomers,
    repeatCustomers,
    avgValue: Math.round(avgValue),
    cancellationRate: Math.round(cancellationRate * 10) / 10,
  }
}

export async function getUtilizationStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { data: variants, error } = await supabase
    .from('item_variants')
    .select('total_stock, available_stock, reserved_stock, items!inner(business_id, branch_id)')
    .eq('items.business_id', staff.business_id)
    .eq('items.branch_id', staff.branch_id)

  if (error) throw formatError(error)

  const total = variants.reduce((sum, v) => sum + v.total_stock, 0)
  const reserved = variants.reduce((sum, v) => sum + v.reserved_stock, 0)
  const utilization = total > 0 ? (reserved / total) * 100 : 0

  return { totalItems: total, reservedItems: reserved, utilizationRate: Math.round(utilization) }
}

export async function getInventoryPerformance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { data: items, error } = await supabase
    .from('items')
    .select('id, name, category, total_revenue, purchase_cost, total_rentals')
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .eq('is_active', true)
    .order('total_revenue', { ascending: false })
    .limit(10)

  if (error) throw formatError(error)

  const itemIds = items.map(i => i.id)
  let itemExpenses: Record<string, number> = {}

  if (itemIds.length > 0) {
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('item_id, amount')
      .in('item_id', itemIds)

    if (expensesData) {
      itemExpenses = expensesData.reduce((acc, exp) => {
        if (exp.item_id) acc[exp.item_id] = (acc[exp.item_id] || 0) + Number(exp.amount)
        return acc
      }, {} as Record<string, number>)
    }
  }

  return items.map(item => {
    const revenue = Number(item.total_revenue) || 0
    const cost = Number(item.purchase_cost) || 0
    const maintenanceExpenses = itemExpenses[item.id] || 0
    const totalCost = cost + maintenanceExpenses
    const netProfit = revenue - totalCost
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0
    return { ...item, roi: Math.round(roi), revenue, cost, maintenanceExpenses, netProfit, totalCost }
  })
}
