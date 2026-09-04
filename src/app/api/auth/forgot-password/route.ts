import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAuthRedirectUrl } from '@/lib/auth/redirect-url'

const requestSchema = z.object({
  email: z.string().trim().email(),
})

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED !== 'true') {
    return NextResponse.json(
      {
        error: 'Password recovery is disabled until production email delivery is configured.',
        code: 'EMAIL_AUTH_DISABLED',
      },
      { status: 503 }
    )
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getAuthRedirectUrl('/auth/callback?next=/reset-password'),
  })

  if (error) {
    return NextResponse.json({ error: 'Unable to send a recovery email.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
