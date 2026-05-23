# Supabase Auth Email Template

Supabase sends a magic-link email by default for `signInWithOtp`. To send the 6-digit OTP code, update the hosted Supabase Auth **Magic Link** template to the HTML in `fabb-magic-link-otp.html`.

Also set Auth URL configuration to the current production app:

- Site URL: `https://fabbin-xi.vercel.app`
- Redirect URLs:
  - `https://fabbin-xi.vercel.app/auth/callback`
  - `https://fabbin-xi.vercel.app/auth/confirm`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`

The template includes `{{ .Token }}` for manual OTP entry and a fallback button to `https://fabbin-xi.vercel.app/auth/confirm?token_hash={{ .TokenHash }}&type=email`, so it does not depend on an old Supabase Site URL.
