import { createClient } from '@/lib/supabase/server'
export async function GET(request: Request) {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const path = new URL(request.url).searchParams.get('path')
  if (!path || !/^[0-9a-f-]{36}\/(items|logos)\/[^/]+$/.test(path)) return new Response('Invalid image path', { status: 400 })
  const { data, error } = await client.storage.from('images').download(path)
  if (error || !data) return new Response('Image not found', { status: 404 })
  return new Response(data, { headers: { 'Content-Type': data.type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
