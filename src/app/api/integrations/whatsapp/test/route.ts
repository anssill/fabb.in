import { NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsapp'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  
  // Verify session for security
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { phone } = await req.json()
    
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Call the WhatsApp Service with the template 'hello_world' - Meta's official test template
    const result = await WhatsAppService.sendTemplate({
      phoneNumber: phone,
      templateName: 'hello_world',
      variables: ['Fabb.booking Test Panel']
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('WhatsApp Test Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
