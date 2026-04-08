'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, subDays, format, eachDayOfInterval, isSameDay } from 'date-fns'

function formatError(error: any): Error {
  return new Error(error?.message || error?.code || 'Database error')
}

export async function getRevenueStats(period: '7d' | '30d' | '90d' = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const startDate = startOfDay(subDays(new Date(), days - 1))

  // Fetch payments for the business within the period
  const { data: payments, error: pError } = await supabase
    .from('booking_payments')
    .select('amount, created_at, method, type')
    .eq('business_id', staff.business_id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (pError) throw pError

  // Fetch expenses for the business within the period
  const { data: expenses, error: eError } = await supabase
    .from('expenses')
    .select('amount, category, expense_date')
    .eq('business_id', staff.business_id)
    .gte('expense_date', startDate.toISOString())

  if (eError) throw eError

  // Booking Sources
  const { data: bookingsSource, error: sError } = await supabase
    .from('bookings')
    .select('booking_source')
    .eq('business_id', staff.business_id)
    .gte('created_at', startDate.toISOString())

  if (sError) throw sError

  // Aggregate daily revenue
  const interval = eachDayOfInterval({
    start: startDate,
    end: new Date()
  })

  const dailyData = interval.map(day => {
    const dayPayments = payments?.filter(p => isSameDay(new Date(p.created_at), day)) || []
    const dayExpenses = expenses?.filter(e => e.expense_date && isSameDay(new Date(e.expense_date), day)) || []

    const revenue = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const expense = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      date: format(day, 'dd MMM'),
      revenue,
      expense,
      profit: revenue - expense
    }
  })

  // Summary Metrics
  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  
  // Method Distribution
  const methods = ['cash', 'upi', 'bank_transfer', 'card']
  const methodDistribution = methods.map(method => ({
    name: method.replace('_', ' ').toUpperCase(),
    value: payments?.filter(p => p.method === method).reduce((sum, p) => sum + Number(p.amount), 0) || 0
  })).filter(m => m.value > 0)

  return {
    dailyData,
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      paymentCount: payments?.length || 0
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

export async function getUtilizationStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { data: variants, error } = await supabase
    .from('item_variants')
    .select('total_stock, available_stock, reserved_stock, items!inner(business_id)')
    .eq('items.business_id', staff.business_id)

  if (error) throw formatError(error)

  const total = variants.reduce((sum, v) => sum + v.total_stock, 0)
  const reserved = variants.reduce((sum, v) => sum + v.reserved_stock, 0)
  const utilization = total > 0 ? (reserved / total) * 100 : 0

  return {
    totalItems: total,
    reservedItems: reserved,
    utilizationRate: Math.round(utilization)
  }
}

export async function getInventoryPerformance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  // Fetch top performing items by total_revenue
  const { data: items, error } = await supabase
    .from('items')
    .select('id, name, category, total_revenue, purchase_cost, total_rentals')
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .order('total_revenue', { ascending: false })
    .limit(10)

  if (error) throw formatError(error)

  // Fetch expenses linked to these items
  const itemIds = items.map(i => i.id)
  let itemExpenses: Record<string, number> = {}
  
  if (itemIds.length > 0) {
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('item_id, amount')
      .in('item_id', itemIds)
      
    if (expensesData) {
      itemExpenses = expensesData.reduce((acc, exp) => {
        if (exp.item_id) {
          acc[exp.item_id] = (acc[exp.item_id] || 0) + Number(exp.amount)
        }
        return acc
      }, {} as Record<string, number>)
    }
  }

  const performance = items.map(item => {
    const revenue = Number(item.total_revenue) || 0
    const cost = Number(item.purchase_cost) || 0
    const maintenanceExpenses = itemExpenses[item.id] || 0
    const totalCost = cost + maintenanceExpenses
    const netProfit = revenue - totalCost
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0
    
    return {
      ...item,
      roi: Math.round(roi),
      revenue,
      cost,
      maintenanceExpenses,
      netProfit,
      totalCost
    }
  })

  return performance
}
