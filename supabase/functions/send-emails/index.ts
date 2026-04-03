import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  const { type, to, name, business_name, login_link, reset_link } = await req.json()
  const KEY = Deno.env.get('RESEND_API_KEY')!

  const emailHTML = {
    business_approved: `<div style="font-family:sans-serif;max-width:600px"><div style="background:#CCFF00;padding:24px;text-align:center"><h1 style="margin:0;color:#000">Echo</h1></div><div style="padding:32px"><h2>Welcome, ${name}!</h2><p>Your store <strong>${business_name}</strong> is live on Echo.</p><a href="${login_link}" style="background:#CCFF00;color:#000;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">Login to Echo →</a></div></div>`,
    staff_approved: `<div style="font-family:sans-serif;padding:32px"><h2>You're in, ${name}!</h2><p>Your Echo access has been approved.</p><a href="${login_link}">Login here →</a></div>`,
    signup_received: `<div style="font-family:sans-serif;padding:32px"><h2>Thanks ${name}!</h2><p>We received your application for <strong>${business_name}</strong>. We'll be in touch.</p></div>`,
    password_reset: `<div style="font-family:sans-serif;padding:32px"><h2>Reset your password</h2><p>Click below to reset your Echo password. Expires in 1 hour.</p><a href="${reset_link}" style="background:#CCFF00;color:#000;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">Reset Password →</a></div>`
  }

  const subjects = {
    business_approved: `Your Echo store is ready — ${business_name}`,
    staff_approved: 'Your Echo access is approved',
    signup_received: `We received your Echo application`,
    password_reset: 'Reset your Echo password'
  }

  const r = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${KEY}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ from:'Echo <hello@echo.app>', to, subject:subjects[type as keyof typeof subjects], html:emailHTML[type as keyof typeof emailHTML] })
  })

  return new Response(JSON.stringify({ success: r.ok }), { headers:{'Content-Type':'application/json'} })
})
