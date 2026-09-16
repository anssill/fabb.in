import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { sendSMS } from '@/lib/sms/msg91'
const schema = z.object({ bookingId: z.string().uuid(), templateKey: z.enum(['booking_confirmed','payment_receipt','pickup_reminder','return_reminder']) })
export async function POST(request: Request) {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({error:'Not authenticated'},{status:401})
  const { data: staff } = await client.from('staff').select('business_id,role,permissions,status').eq('id',user.id).single()
  if (!staff || staff.status !== 'active' || !hasPermission(staff.role,staff.permissions as Record<string,boolean>,'manage_bookings')) return NextResponse.json({error:'Booking permission required'},{status:403})
  const parsed = schema.safeParse(await request.json().catch(()=>null))
  if (!parsed.success) return NextResponse.json({error:'Choose a booking and template'},{status:400})
  const { data: booking } = await client.from('bookings').select('id,business_id,branch_id,customer_id,booking_number,pickup_date,return_date,amount_paid,customers(name,phone),branches(settings),booking_payments(amount,type,is_voided,created_at)').eq('id',parsed.data.bookingId).eq('business_id',staff.business_id!).single()
  if (!booking) return NextResponse.json({error:'Booking not found'},{status:404})
  const branch = Array.isArray(booking.branches) ? booking.branches[0] : booking.branches
  const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers
  const settings = (branch?.settings as any)?.sms
  const template = settings?.templates?.[parsed.data.templateKey]
  if (!settings?.enabled || !template?.templateId) return NextResponse.json({error:'Enable SMS and save an approved Flow ID in SMS settings'},{status:400})
  if (!process.env.MSG91_AUTH_KEY) return NextResponse.json({error:'MSG91 key is not configured on the server'},{status:503})
  const phone=customer?.phone
  if (!phone || !/^(91)?[6-9]\d{9}$/.test(phone.replace(/\D/g,''))) return NextResponse.json({error:'Customer needs a valid Indian mobile number'},{status:400})
  const payments = (booking.booking_payments ?? []).filter(p => !p.is_voided && ['advance','balance'].includes(p.type)).sort((a,b) => b.created_at.localeCompare(a.created_at))
  if (parsed.data.templateKey === 'payment_receipt' && !payments.length) return NextResponse.json({error:'This booking has no rental payment to receipt'},{status:400})
  const result=await sendSMS({phone,templateId:template.templateId,placeholders:{booking_id:booking.booking_number,pickup_date:booking.pickup_date,return_date:booking.return_date,amount:Number(payments[0]?.amount ?? 0).toFixed(2)},businessId:booking.business_id,branchId:booking.branch_id,bookingId:booking.id,customerId:booking.customer_id,sentBy:user.id})
  return NextResponse.json({success:result.success,...(!result.success?{error:'MSG91 did not accept this message. Check the approved Flow ID and provider logs.'}:{})},{status:result.success?200:502})
}
