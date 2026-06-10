import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.43.4'
import webpush from 'npm:web-push'

type PushRequest = {
  business_id: string
  title: string
  body: string
  url?: string
  tag?: string
  user_ids?: string[]
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

webpush.setVapidDetails(
  'mailto:info@fabbclothing.com',
  vapidPublicKey,
  vapidPrivateKey
)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const payload = await req.json() as PushRequest
    if (!payload.business_id || !payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: 'business_id, title, and body are required' }), { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    let query = supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('business_id', payload.business_id)

    if (payload.user_ids?.length) {
      query = query.in('user_id', payload.user_ids)
    }

    const { data: subscriptions, error } = await query
    if (error) throw error

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      tag: payload.tag || 'fabb-notification',
    })

    const results = await Promise.allSettled(
      (subscriptions || []).map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, notification)
          return { id: row.id, sent: true }
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', row.id)
          }
          throw error
        }
      })
    )

    return new Response(JSON.stringify({
      sent: results.filter((result) => result.status === 'fulfilled').length,
      failed: results.filter((result) => result.status === 'rejected').length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-push-notification error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500 })
  }
})
