# Upload and mobile fixes — 16 September 2026

## Changes
- Corrected five Storage policies that mistakenly matched staff.name instead of storage.objects.name.
- Added private, business/branch/booking-scoped pickup evidence uploads and an authenticated image endpoint.
- Preserve previously saved pickup photos and surface failed photo saves.
- Corrected Radix tab orientation/state styling and the mobile tab height.
- Reworked mobile booking cards so dates, total, and balance remain visible.
- Shortened search placeholders to Search and limited recent customers to three with Show more.
- Removed Available units today and months without booking/payment activity.
- Removed obsolete attendance offline queue code and refreshed connectivity on resume/focus.

## Verification
- 40 automated tests pass, including private evidence authentication/path/type checks and Radix tab rendering.
- Production build and TypeScript pass; ESLint reports no errors.
- Rendered actual booking list, customer step, and tabs with synthetic data at mobile widths. No horizontal page overflow at 320px or 390px; desktop booking list checked at 1440px.
- Read-only authenticated SQL checks: allowed own-business logos, item images, customer documents, and valid pickup evidence; denied another business, a nonexistent booking, and the obsolete pickup path.
- Database checks found zero tenant mismatches across checked booking/customer/item/variant relationships, zero negative stock/booking amounts, and zero unvalidated public constraints.
- All public tables retain RLS; all four buckets remain private. The unused exports bucket remains inaccessible to clients.

## Limits and existing advisory
No live customer bookings, payments, passwords, or files were created or changed during verification. Authenticated browser uploads and physical phone testing still need a signed-in user to try the deployed flow; policy predicate checks are not an end-to-end Storage upload test.

Supabase reports one existing security advisory: [leaked-password protection is disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Performance notices are informational unused-index recommendations, not runtime errors. No indexes were removed.
