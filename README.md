# FABB Rental Management

FABB is an internal, multi-tenant clothing-rental platform built with Next.js and Supabase. Inventory availability is derived for a selected pickup-to-return period; it is not managed as a sales-style permanent available/reserved counter.

## Rental-first capabilities

- Branch- and size-specific date availability with active holds, reservations, early returns, unavailable stock and transfers.
- Draft/quote, hold, confirmed, picked-up, partially returned, returned, closed and cancelled booking states.
- Quantity-tracked products, premium QR/asset pieces and multi-piece bundle definitions.
- Partial pickup/return, exact asset returns, damaged/missing ledgers and audited restoration.
- Customer, payment, refundable-deposit, expense, attendance, payroll and reporting foundations.
- GST/non-GST profiles, financial ledgers, document sequences and immutable posted-document structures.
- Granular permissions and tenant/branch Row Level Security.
- PWA shell with online-only operational writes and queued offline attendance.
- WhatsApp/SMS outbox foundations and protected evidence/customer-document storage.

Legacy Archive, Stocktakes and Transfers have been removed from the application. Existing historical database records remain intact. Washing, quality audits, colour variants, retail sales/POS, public booking, supplier purchasing, delivery, subscription enforcement and Notion are intentionally excluded.

## Booking pricing

New bookings charge a price per piece for the entire booking, with an individual percentage discount for each item. Totals are calculated and saved atomically in Supabase. Existing daily-rate bookings keep their original pricing basis and stored billable days.

Use **Edit item prices** on a saved booking to adjust rates and discounts. Closed/cancelled bookings cannot be repriced; stale changes and totals below recorded rental payments are rejected. Refundable deposits remain separate from rental dues. Payment posting validates balance/refund limits and synchronizes stored booking balances.

The migration adds pricing columns and authenticated RPCs without deleting historical data. SQL regression checks in `supabase/tests/002_booking_pricing_rollback.sql` must be wrapped in `BEGIN` / `ROLLBACK`; they create transient fixtures and require an existing active owner and branch.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS and Radix/shadcn components
- Supabase Auth, PostgreSQL, Row Level Security and Storage
- Zustand, TanStack Query and React Hook Form

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and provide development Supabase credentials.
3. Start the app with `npm run dev`.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required for both local development and production builds. Server-side account completion, invitations, and branch switching also require `SUPABASE_SECRET_KEY`. Use development credentials locally; never commit `.env.local`.

Useful verification commands:

```bash
npm test
npx tsc --noEmit
npm run lint -- --quiet
npm run build
```

## Production deployment

- Supabase: `fabb-rentals-production` (`tbslecynnuakujtsqxbq`), Mumbai (`ap-south-1`).
- Vercel project: `fabb.in`, deployed from GitHub `anssill/fabb.in`.
- Temporary canonical URL: `https://fabbin-ansils-projects-3a333fbb.vercel.app`.
- Production branch: `main`.

The initial empty-database schema is at `supabase/migrations/20260903205643_full_rental_rebuild_zero_state.sql`. Apply subsequent migrations in `supabase/migrations` as well. Its pgTAP contract is `supabase/tests/001_rental_rebuild_contract.sql`.

Production uses the modern Supabase key names shown in `.env.example`. Real credentials belong only in Supabase/Vercel secret stores and must never be committed. Meta WhatsApp and MSG91 remain disabled until their optional server credentials are configured.

The previous `fabb.booking` project is a separate legacy system and must not be linked, migrated, reset or modified by this application.

## License

Internal proprietary software — © 2026 FABB.
