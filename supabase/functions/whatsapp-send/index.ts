import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { booking_id, template_type, customer_phone, staff_id, params } = await req.json()
  const TOKEN = Deno.env.get('WHATSAPP_TOKEN')!
  const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const raw = customer_phone.replace(/\D/g, '')
  const phone = raw.startsWith('91') ? raw : `91${raw}`

  let status = 'failed'
  try {
    const r = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization':`Bearer ${TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'template',
        template: {
          name: template_type,
          language: { code: 'en' },
          components: params?.length ? [{
            type: 'body',
            parameters: params.map((p:string) => ({ type:'text', text:p }))
          }] : []
        }
      })
    })
    if (r.ok) status = 'sent'
    else {
      const err = await r.json()
      console.error('WhatsApp error:', JSON.stringify(err))
    }
  } catch (e) {
    console.error('WhatsApp fetch failed:', e)
  }

  const { data:b } = await supabase.from('bookings')
    .select('branch_id, customer_id').eq('id', booking_id).single()

  await supabase.from('whatsapp_log').insert({
    branch_id: b?.branch_id, customer_id: b?.customer_id,
    customer_phone: phone, booking_id, staff_id,
    template_type, status, sent_at: new Date().toISOString()
  })

  return new Response(JSON.stringify({ success: status==='sent', status }), {
    headers: { 'Content-Type':'application/json' }
  })
})
