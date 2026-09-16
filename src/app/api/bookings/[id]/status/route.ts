import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUuid, safeJsonParse } from '@/lib/api-utils'
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const {id}=await params
 if (!isValidUuid(id)) return NextResponse.json({error:'Invalid booking ID'},{status:400})
 const db=await createClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
 try {
  const body=await safeJsonParse(request)
  if(['returned','picked_up'].includes(body.status) && !body.idempotencyKey) throw new Error('Return request identifier required')
  const {data,error}=await (db.rpc as any)('apply_booking_command',{p_booking_id:id,p_input:{status:body.status,returns:body.returns??[],payments:body.payments??[],pickupPhotos:body.pickupPhotos??[],settlement:body.settlement??null},p_key:body.idempotencyKey||crypto.randomUUID()})
  if(error) throw new Error(error.message)
  return NextResponse.json(data)
 } catch(error) {return NextResponse.json({error:error instanceof Error?error.message:'Status update failed'},{status:400})}
}
