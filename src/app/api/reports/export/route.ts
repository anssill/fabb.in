import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const REPORTS = new Set(['bookings', 'inventory', 'customers', 'payments', 'expenses', 'unavailable'])

function csvCell(value: unknown) {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return 'No records\r\n'
  const headers = Object.keys(rows[0])
  return [headers.map(csvCell).join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(','))].join('\r\n')
}

export async function GET(request: NextRequest) {
  const report = request.nextUrl.searchParams.get('report') || ''
  if (!REPORTS.has(report)) return NextResponse.json({ error: 'Unsupported report' }, { status: 400 })

  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) return NextResponse.json({ error: 'Active branch required' }, { status: 403 })

  let rows: Record<string, unknown>[] = []
  if (report === 'bookings') {
    const { data, error } = await db.from('bookings').select('booking_number,status,pickup_date,event_date,return_date,total_amount,balance_due,customer:customers(name,phone)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).order('pickup_date', { ascending: false }).limit(10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    rows = (data || []).map((row: any) => ({ booking_number: row.booking_number, customer: Array.isArray(row.customer) ? row.customer[0]?.name : row.customer?.name, phone: Array.isArray(row.customer) ? row.customer[0]?.phone : row.customer?.phone, status: row.status, pickup_date: row.pickup_date, event_date: row.event_date, return_date: row.return_date, total_amount: row.total_amount, balance_due: row.balance_due }))
  } else if (report === 'inventory') {
    const { data, error } = await db.from('item_variants').select('size,total_stock,item:items(name,sku,category,tracking_mode,archived_at)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).is('archived_at', null).limit(10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    rows = (data || []).map((row: any) => { const item = Array.isArray(row.item) ? row.item[0] : row.item; return { sku: item?.sku, product: item?.name, category: item?.category, tracking_mode: item?.tracking_mode, size: row.size, physical_quantity: row.total_stock } })
  } else if (report === 'customers') {
    const { data, error } = await db.from('customers').select('name,phone,email,address,risk_status,total_bookings,total_spent,last_booking_at,created_at').eq('business_id', staff.business_id).is('archived_at', null).order('created_at', { ascending: false }).limit(10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    rows = data || []
  } else if (report === 'payments') {
    const { data, error } = await db.from('financial_entries').select('posted_at,entry_type,amount,payment_method,reference_number,note,booking:bookings(booking_number)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).order('posted_at', { ascending: false }).limit(10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    rows = (data || []).map((row: any) => ({ posted_at: row.posted_at, booking_number: Array.isArray(row.booking) ? row.booking[0]?.booking_number : row.booking?.booking_number, entry_type: row.entry_type, amount: row.amount, payment_method: row.payment_method, reference_number: row.reference_number, note: row.note }))
  } else if (report === 'expenses') {
    const { data, error } = await db.from('expenses').select('expense_date,category,description,amount,payment_method,created_at').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).order('expense_date', { ascending: false }).limit(10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    rows = data || []
  } else {
    const { data, error } = await db.from('inventory_unavailability').select('recorded_at,reason,quantity,restored_quantity,notes,item:items(name,sku),variant:item_variants(size)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).order('recorded_at', { ascending: false }).limit(10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    rows = (data || []).map((row: any) => ({ recorded_at: row.recorded_at, sku: Array.isArray(row.item) ? row.item[0]?.sku : row.item?.sku, product: Array.isArray(row.item) ? row.item[0]?.name : row.item?.name, size: Array.isArray(row.variant) ? row.variant[0]?.size : row.variant?.size, reason: row.reason, quantity: row.quantity, restored_quantity: row.restored_quantity, open_quantity: Number(row.quantity) - Number(row.restored_quantity), notes: row.notes }))
  }

  const filename = `fabb-${report}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(`\uFEFF${toCsv(rows)}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
