# ████████████████████████████████████████████████████████████
# ECHO — GODMODE PROMPT v7.0 ABSOLUTE FINAL
# THE SINGLE MOST COMPLETE SAAS PROMPT EVER WRITTEN
# EVERY FEATURE. EVERY SCREEN. EVERY BUTTON. EVERY FIELD.
# EVERY RULE. EVERY API. EVERY COMPONENT. EVERY EDGE CASE.
# Save as CLAUDE.md in c:\echo\ — auto-loaded every session
# Owner: Ansil | India-first Clothing Rental SaaS
# ████████████████████████████████████████████████████████████

---

# ══════════════════════════════════════════════════════════════
# SECTION 1: PRODUCT IDENTITY + HOW THE SAAS WORKS
# ══════════════════════════════════════════════════════════════

## What Echo Is
Echo is a multi-tenant India-first clothing rental management SaaS.
It replaces WhatsApp notes, Excel sheets, and paper ledgers for
clothing rental businesses (lehengas, sherwanis, sarees, suits).

## Item Categories
Women's: Lehenga, Saree, Salwar Kameez, Gown, Anarkali
Men's: Kurtha, Suit, Sherwani, Jodhpuri, Bandhgala
Accessories: Shawl, Dupatta, Jewellery, Belt, Mojri, Loafer

## How Multi-Tenancy Works
- Single Supabase project, shared database
- Every table has RLS (Row Level Security)
- Every query auto-filtered by branch_id/business_id from auth
- Staff from Business A CANNOT see Business B data — guaranteed at DB
- Subdomain: businessname.echo.app = isolated business data
- Staff see only their branch. Managers see their branch.
- Super Admin (Ansil) sees ALL businesses

## User Types
TYPE 1 — Business Owner:
  Signs up at echo.app/signup → instant access → setup wizard → dashboard
  Role: manager by default

TYPE 2 — Staff Member:
  Visits businessname.echo.app/signup → fills form → status=pending
  Manager approves from notification inbox → staff gets access

TYPE 3 — Super Admin (Ansil only):
  Created manually in Supabase
  Sees all businesses, all branches, all data

## Auth Flow (Every Request)
  Every route → middleware.ts runs →
  Not authenticated? → /login
  staff.status != approved? → /pending-approval
  Role missing access? → /dashboard
  Otherwise → serve page

---

# ══════════════════════════════════════════════════════════════
# SECTION 2: ABSOLUTE RULES — NEVER VIOLATE
# ══════════════════════════════════════════════════════════════

1.  TypeScript strict mode — zero `any`, zero @ts-ignore
2.  RLS on every Supabase table — no exceptions ever
3.  Check staff.status === approved on every protected route
4.  logAudit() after every INSERT, UPDATE, DELETE
5.  Skeleton loading only — never spinners, never loading text
6.  No AI features in the product — zero LLM
7.  No coupon system — discount via price override only
8.  No auto WhatsApp — every send is manual by staff
9.  Mobile-first — 375px screens first
10. India-first — INR ₹, IST Asia/Kolkata, Indian phone validation
11. Google OAuth does NOT bypass manager approval
12. Never hardcode business_id or branch_id
13. Draft auto-saves at every booking wizard step
14. npm run build after every module — zero errors
15. Check codebase before writing — never rebuild existing

---

# ══════════════════════════════════════════════════════════════
# SECTION 3: COMPLETE TECH STACK
# ══════════════════════════════════════════════════════════════

## Install All Dependencies
npm install next@14 react react-dom typescript
npm install tailwindcss postcss autoprefixer
npm install @supabase/supabase-js @supabase/ssr
npm install next-themes
npm install zustand
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form zod @hookform/resolvers
npm install date-fns date-fns-tz
npm install recharts
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install html5-qrcode
npm install react-dropzone react-image-crop
npm install browser-image-compression
npm install framer-motion
npm install react-to-print
npm install @react-pdf/renderer
npm install next-pwa
npm install sonner
npm install lucide-react
npm install papaparse @types/papaparse
npm install bcryptjs @types/bcryptjs
npm install sentry/nextjs
npm -D install @playwright/test vitest

npx shadcn-ui@latest init
npx shadcn-ui@latest add card table dialog sheet tabs select badge progress
npx shadcn-ui@latest add avatar skeleton switch button input label textarea
npx shadcn-ui@latest add checkbox radio-group separator scroll-area
npx shadcn-ui@latest add dropdown-menu popover command tooltip alert alert-dialog calendar

## Framework Decisions
Next.js 14+ App Router — SSR, Server Components, middleware
TailwindCSS — mobile-first utilities, animate-pulse skeleton
shadcn/ui — accessible components, Tailwind-native
next-themes — dark/light mode with class strategy
Poppins font — next/font/google, weights 400 500 600 700 800 900
Zustand — auth state, booking wizard, UI state
TanStack Query v5 — caching, infinite scroll, mutations
React Hook Form + Zod — all forms, type-safe validation
date-fns + date-fns-tz — IST timezone, all date math
Recharts — BarChart PieChart LineChart (analytics, dashboard)
TanStack Table — analytics tables, transaction list
@dnd-kit — photo reorder, menu reorder
html5-qrcode — QR scanner in booking, washing, pickup
react-dropzone — file upload everywhere
react-image-crop — crop before upload
browser-image-compression — compress all images (max 800KB)
framer-motion — slide-overs, transitions, modals, stagger
react-to-print — 68mm thermal printing
@react-pdf/renderer — PDF exports
next-pwa — PWA push notifications
sonner — all toasts (success error undo)
lucide-react — all icons
Papa Parse — CSV bulk import in inventory
bcryptjs — email password hashing
Sentry — production error tracking

## Backend
Supabase PostgreSQL — Mumbai ap-south-1 (MANDATORY)
Supabase Auth — Google OAuth + email/password
Supabase Storage — photos(public) documents(private) receipts(private)
Supabase Realtime — 4 WebSocket channels
Supabase Edge Functions — Deno runtime, 6 functions
pg_cron — scheduled jobs
Resend — transactional email

## Deployment
Vercel — frontend, wildcard subdomains *.echo.app
Supabase Cloud — Mumbai ap-south-1
GitHub Actions — TypeScript + lint + test + deploy on push to main

---

# ══════════════════════════════════════════════════════════════
# SECTION 4: DESIGN SYSTEM
# ══════════════════════════════════════════════════════════════

## Font
Poppins from Google Fonts
In app/layout.tsx:
  import { Poppins } from 'next/font/google'
  const poppins = Poppins({ subsets:['latin'], weight:['400','500','600','700','800','900'], variable:'--font-poppins' })
  <html className={poppins.variable}>
  font-family: var(--font-poppins) in globals.css

## Color Tokens
Primary: #CCFF00
  Use for: active sidebar, primary buttons, focus rings, progress bars,
           selected items, highlights, bookings confirmed badge

Dark theme (class="dark"):
  --bg: #09090b (zinc-950)
  --card: #18181b (zinc-900)
  --border: #27272a (zinc-800)
  --text: #fafafa (zinc-50)
  --muted: #a1a1aa (zinc-400)
  --input-bg: #27272a

Light theme (default):
  --bg: #f4f4f5 (zinc-100)
  --card: #ffffff
  --border: #e4e4e7 (zinc-200)
  --text: #09090b (zinc-950)
  --muted: #71717a (zinc-500)
  --input-bg: #ffffff

Status colors (same both themes):
  Confirmed / Success: #22c55e (green-500)
  Active / Info: #3b82f6 (blue-500)
  Overdue / Error: #ef4444 (red-500)
  Urgent / Warning: #f59e0b (amber-500)
  Returned / Muted: #71717a (zinc-500)
  Draft: #CCFF00

## Dark/Light Toggle
next-themes ThemeProvider in app/providers.tsx:
  attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange

tailwind.config.ts: darkMode: 'class'

All components: bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50

Toggle component (in TopBar):
  import { useTheme } from 'next-themes'
  const { theme, setTheme } = useTheme()
  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  </button>

## shadcn/ui Global Theme Override in globals.css
:root {
  --primary: 79 100% 50%;
  --primary-foreground: 0 0% 0%;
  --radius: 0.75rem;
}

## shadcn/ui Component Map — Where Each Is Used
Card → stat cards, booking cards, item rows, customer overview, settings sections
Table → customers list, staff list, analytics, payments, audit log
Dialog → edit booking, add payment, blacklist modal, confirm delete, PIN setup
Sheet → notification inbox, customer slide-over, global search, add expense
Tabs → booking detail, item detail, customer slide-over, analytics, settings
Select → all dropdowns: role, branch, category, filter, sort
Badge → status (booking/item/customer), tier, role, priority, condition
Progress → completeness score, revenue goal, performance targets
Avatar → staff photos, customer initials, sidebar profile
Skeleton → all loading states for lists, cards, stats
Switch → all toggles: watermark, washing auto-add, expense link, opening hours
Button → all buttons (variant: default=#CCFF00, outline, ghost, destructive)
Input → all text inputs in forms
Label → all form labels
Textarea → notes, description, reasons, terms
Checkbox → opening checklist, accessories checklist, bulk select
RadioGroup → condition selector (excellent/good/damaged/missing)
Separator → dividers in detail panels
ScrollArea → long lists inside slide-overs
DropdownMenu → 3-dot actions on cards, staff actions
Popover → date picker, branch switcher
Command → global search results
Tooltip → icon buttons, collapsed sidebar items
Alert → info banners, warnings
AlertDialog → destructive confirmations (cancel booking, delete, suspend)
Calendar → date picker in booking wizard

## Animation Specs (framer-motion)
Slide-over (Sheet): x from 400 to 0, 300ms ease
Bottom sheet (mobile): y from 100% to 0, 300ms ease
Modal (Dialog): scale 0.95→1 opacity 0→1, 200ms
Page transition: opacity 0→1 x 20→0, 200ms
List items: staggerChildren 0.05s per item
Notification new: y -20→0 opacity 0→1

## Layout
Sidebar: fixed left, 260px expanded / 64px collapsed
TopBar: fixed top, h-16, left=sidebar-width right=0
Content: pt-16 pl-sidebar-width, scrollable
Mobile: sidebar hidden, hamburger opens full-screen drawer

---

# ══════════════════════════════════════════════════════════════
# SECTION 5: ALL 10 EXTERNAL APIs — SETUP + FULL CODE
# ══════════════════════════════════════════════════════════════

## API 1: SUPABASE AUTH (Google OAuth + Email)

### lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
export const createClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

### lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value, set: (n,v,o) => cookieStore.set(n,v,o), remove: (n,o) => cookieStore.delete(n) } }
  )
}

### Google OAuth Setup
1. console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Authorized redirect URI: https://[PROJECT_ID].supabase.co/auth/v1/callback
3. Also add: http://localhost:54321/auth/v1/callback (for local dev)
4. Copy Client ID + Client Secret
5. Supabase Dashboard → Auth → Providers → Google → Enable → Paste → Save

### Google Login Call (frontend)
const supabase = createClient()
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
})

### Email Login Call (frontend)
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
// We handle email login via custom API route for rate limiting

### app/auth/callback/route.ts (COMPLETE)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`)

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get:(n)=>cookieStore.get(n)?.value, set:(n,v,o)=>cookieStore.set(n,v,o), remove:(n,o)=>cookieStore.delete(n) } }
  )

  const { data:{ session }, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !session) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

  const { data: staffRecord } = await supabase
    .from('staff').select('status, setup_completed').eq('id', session.user.id).single()

  if (!staffRecord) {
    const hostname = request.headers.get('host') || ''
    const subdomain = hostname.split('.')[0]
    const { data: branch } = await supabase
      .from('branches').select('id, business_id').eq('subdomain_prefix', subdomain).single()

    await supabase.from('staff').insert({
      id: session.user.id, email: session.user.email!,
      business_id: branch?.business_id, branch_id: branch?.id,
      role: 'floor_staff', status: 'pending', setup_completed: false
    })
    await supabase.from('login_requests').insert({ staff_id: session.user.id })
    await supabase.from('notifications').insert({
      branch_id: branch?.id, type: 'approval_pending',
      title: 'New Staff Login Request',
      body: `${session.user.email} wants to join`,
      action_type: 'approve', action_data: { staff_id: session.user.id }
    })
    return NextResponse.redirect(`${origin}/pending-approval`)
  }

  if (staffRecord.status === 'pending') return NextResponse.redirect(`${origin}/pending-approval`)
  if (staffRecord.status === 'suspended') return NextResponse.redirect(`${origin}/suspended`)

  await supabase.from('staff').update({ last_login: new Date().toISOString() }).eq('id', session.user.id)
  if (!staffRecord.setup_completed) return NextResponse.redirect(`${origin}/setup`)
  return NextResponse.redirect(`${origin}/dashboard`)
}

## API 2: SUPABASE DATABASE (PostgREST via Supabase JS)

### Common Patterns

Fetch with deep joins:
const { data } = await supabase.from('bookings')
  .select(`
    *,
    customer:customers(id,name,phone,tier,risk_level,blacklist_level),
    booking_items(
      id, size, quantity, daily_rate, subtotal,
      condition_before, condition_after, before_photo_url,
      item:items(id,name,sku,cover_photo_url,category),
      variant:item_variants(id,size,colour,available_count)
    ),
    booking_payments(id,type,amount,method,is_voided,timestamp),
    booking_accessories(accessory_type,given_at_pickup,returned_at_return)
  `)
  .eq('branch_id', branchId)
  .not('status','eq','deleted')
  .order('created_at', { ascending: false })
  .range(offset, offset + 19)

TanStack Query infinite scroll:
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['bookings', branchId, filters],
  queryFn: async ({ pageParam = 0 }) => {
    const { data, count } = await supabase.from('bookings')
      .select('*', { count: 'exact' })
      .eq('branch_id', branchId)
      .range(pageParam, pageParam + 19)
    return { data: data || [], count, nextOffset: pageParam + 20 }
  },
  getNextPageParam: (lastPage) =>
    lastPage.data.length === 20 ? lastPage.nextOffset : undefined,
  initialPageParam: 0
})

RPC for stock locking:
const { error } = await supabase.rpc('lock_item_stock', { p_variant_id, p_quantity })
if (error) throw new Error('Stock not available')

Upsert for drafts:
await supabase.from('booking_drafts').upsert(
  { id: draftId || undefined, staff_id, branch_id, current_step, draft_data: JSON.stringify(wizardState), updated_at: new Date().toISOString() },
  { onConflict: 'id' }
)

## API 3: SUPABASE REALTIME (4 channels — full setup)

### In app/(dashboard)/page.tsx — useEffect
useEffect(() => {
  const supabase = createClient()

  // CHANNEL 1: Booking changes
  const bookingCh = supabase
    .channel('echo-bookings')
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'bookings',
      filter: `branch_id=eq.${branchId}`
    }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    })
    .subscribe()

  // CHANNEL 2: Washing queue updates
  const washCh = supabase
    .channel('echo-washing')
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'washing_queue',
      filter: `branch_id=eq.${branchId}`
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['washing'] })
      queryClient.invalidateQueries({ queryKey: ['stats', 'washing-urgent'] })
    })
    .subscribe()

  // CHANNEL 3: Payment inserts — update revenue counter live
  const paymentCh = supabase
    .channel('echo-payments')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'booking_payments'
    }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['revenue', 'today'] })
      // Animate revenue counter: store new amount in Zustand
      useUiStore.getState().addLiveRevenue(payload.new.amount)
    })
    .subscribe()

  // CHANNEL 4: New notifications → bell badge + sound + vibration
  const notifCh = supabase
    .channel('echo-notifications')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `target_staff_id=eq.${staffId}`
    }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      new Audio('/sounds/notification.mp3').play().catch(() => {})
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
      toast(payload.new.title, { description: payload.new.body, duration: 6000 })
    })
    .subscribe()

  return () => {
    supabase.removeChannel(bookingCh)
    supabase.removeChannel(washCh)
    supabase.removeChannel(paymentCh)
    supabase.removeChannel(notifCh)
  }
}, [branchId, staffId, queryClient])

## API 4: SUPABASE STORAGE

### Bucket Setup (do once in Supabase Dashboard → Storage)
photos bucket: Public = YES (item photos, profile photos, store logos)
documents bucket: Public = NO (Aadhaar, staff docs) — signed URLs only
receipts bucket: Public = NO (PDF exports, receipts) — signed URLs only

### Upload item photo (with compression + optional watermark)
import imageCompression from 'browser-image-compression'

async function uploadItemPhoto(file: File, itemId: string, branchId: string): Promise<string> {
  // 1. Compress
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true
  })
  // 2. Optional watermark (if branch.settings.watermark_enabled)
  // Draw canvas with text overlay, convert to blob
  // 3. Upload
  const path = `items/${branchId}/${itemId}/${Date.now()}.jpg`
  const supabase = createClient()
  const { data, error } = await supabase.storage.from('photos').upload(path, compressed, {
    contentType: 'image/jpeg', upsert: false
  })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
  return publicUrl
}

### Upload Aadhaar (private, signed URL)
async function uploadAadhaar(file: File, bookingId: string, side: 'front' | 'back'): Promise<string> {
  const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200 })
  const path = `aadhaar/${bookingId}/${side}.jpg`
  const supabase = createClient()
  await supabase.storage.from('documents').upload(path, compressed)
  return path // save path, generate signed URL when viewing
}

### Get signed URL (when viewing private file)
const { data } = await supabase.storage.from('documents').createSignedUrl(path, 3600) // 1 hour
// data.signedUrl = viewable URL

## API 5: SUPABASE EDGE FUNCTIONS (call from frontend)
const supabase = createClient()
await supabase.functions.invoke('notion-sync', { body: { type:'booking_created', booking_id:id } })
await supabase.functions.invoke('whatsapp-send', { body: { booking_id, template_type:'booking_confirmation', customer_phone, staff_id, params:[name,bookingId,date,balance] } })
await supabase.functions.invoke('send-emails', { body: { type:'staff_approved', to:email, name, login_link } })
await supabase.functions.invoke('process-signup', { body: { business_name, owner_name, phone, email, city, business_id, subdomain } })

## API 6: NOTION API
Base URL: https://api.notion.com/v1
Auth: Authorization: Bearer {NOTION_TOKEN}
Header: Notion-Version: 2022-06-28
Used IN: notion-sync Edge Function ONLY (never from frontend)

### Setup (5 steps)
1. notion.so/my-integrations → New Integration → Echo Sync → copy token
2. Create 5 Notion databases:
   a. Bookings: Booking ID(title) Customer Status PickupDate ReturnDate Items Total Branch
   b. Inventory: Name(title) SKU Category Status Condition Price Branch
   c. Washing History: Item(title) Stage Date Staff Cost Notes Branch
   d. Expenses: Date(title) Category Amount Description Branch
   e. P&L: Month(title) Revenue Expenses NetProfit Margin Branch
3. Open each database → Share → Invite → Echo Sync integration
4. Get DB ID from URL: notion.so/{workspace}/{DATABASE_ID}?v=...
5. Store NOTION_TOKEN in Supabase Edge Function secrets
   Store each DB ID in branches.settings JSONB:
   { notion_bookings_db:"xxx", notion_inventory_db:"xxx", ... }

### notion-sync Edge Function (COMPLETE)
// supabase/functions/notion-sync/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOTION_TOKEN = Deno.env.get('NOTION_TOKEN')!
const H = { 'Authorization':`Bearer ${NOTION_TOKEN}`, 'Content-Type':'application/json', 'Notion-Version':'2022-06-28' }

serve(async (req) => {
  const { type, booking_id, item_id } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  if (type === 'booking_created' || type === 'booking_updated') {
    const { data:b } = await supabase.from('bookings')
      .select('*, customer:customers(name,phone), branch:branches(name,settings)').eq('id',booking_id).single()
    const dbId = b.branch.settings.notion_bookings_db
    if (!dbId) return new Response(JSON.stringify({ skipped:true }))

    if (b.notion_page_id && type === 'booking_updated') {
      await fetch(`https://api.notion.com/v1/pages/${b.notion_page_id}`, {
        method:'PATCH', headers:H,
        body:JSON.stringify({ properties:{ 'Status':{ select:{ name:b.status } } } })
      })
    } else {
      const r = await fetch('https://api.notion.com/v1/pages', { method:'POST', headers:H, body:JSON.stringify({
        parent:{ database_id:dbId },
        properties:{
          'Booking ID':{ title:[{ text:{ content:b.booking_id_display } }] },
          'Customer':{ rich_text:[{ text:{ content:b.customer.name } }] },
          'Status':{ select:{ name:b.status } },
          'Pickup Date':{ date:{ start:b.pickup_date } },
          'Return Date':{ date:{ start:b.return_date } },
          'Total':{ number:b.total_amount },
          'Branch':{ rich_text:[{ text:{ content:b.branch.name } }] }
        }
      })})
      const page = await r.json()
      await supabase.from('bookings').update({ notion_page_id:page.id }).eq('id',booking_id)
    }
  }

  if (type === 'item_created' || type === 'item_status_changed') {
    const { data:item } = await supabase.from('items')
      .select('*, branch:branches(name,settings)').eq('id',item_id).single()
    const dbId = item.branch.settings.notion_inventory_db
    if (!dbId) return new Response(JSON.stringify({ skipped:true }))

    if (item.notion_page_id && type === 'item_status_changed') {
      await fetch(`https://api.notion.com/v1/pages/${item.notion_page_id}`, {
        method:'PATCH', headers:H,
        body:JSON.stringify({ properties:{ 'Status':{ select:{ name:item.status } } } })
      })
    } else {
      const r = await fetch('https://api.notion.com/v1/pages', { method:'POST', headers:H, body:JSON.stringify({
        parent:{ database_id:dbId },
        properties:{
          'Item Name':{ title:[{ text:{ content:item.name } }] },
          'SKU':{ rich_text:[{ text:{ content:item.sku||'' } }] },
          'Category':{ select:{ name:item.category } },
          'Status':{ select:{ name:item.status } },
          'Price':{ number:item.price },
          'Branch':{ rich_text:[{ text:{ content:item.branch.name } }] }
        }
      })})
      const page = await r.json()
      await supabase.from('items').update({ notion_page_id:page.id }).eq('id',item_id)
    }
  }

  if (type === 'monthly_expenses') {
    // Pull all expenses from last month, push to Notion Expenses DB
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth()-1)
    const start = new Date(lastMonth.getFullYear(),lastMonth.getMonth(),1).toISOString().split('T')[0]
    const end = new Date(lastMonth.getFullYear(),lastMonth.getMonth()+1,0).toISOString().split('T')[0]
    const { data:expenses } = await supabase.from('expenses').select('*, branch:branches(name,settings)').gte('date',start).lte('date',end)
    const grouped = expenses?.reduce((acc:any,e:any) => { const key=e.branch.settings.notion_expenses_db; if(key) acc[key]=(acc[key]||[]).concat(e); return acc }, {})
    for (const [dbId, items] of Object.entries(grouped||{})) {
      for (const e of items as any[]) {
        await fetch('https://api.notion.com/v1/pages', { method:'POST', headers:H, body:JSON.stringify({
          parent:{ database_id:dbId },
          properties:{
            'Date':{ title:[{ text:{ content:e.date } }] },
            'Category':{ select:{ name:e.category } },
            'Amount':{ number:e.amount },
            'Description':{ rich_text:[{ text:{ content:e.description||'' } }] }
          }
        })})
      }
    }
  }

  return new Response(JSON.stringify({ success:true }), { headers:{'Content-Type':'application/json'} })
})

## API 7: WHATSAPP BUSINESS API (META GRAPH API)
Base URL: https://graph.facebook.com/v17.0
Auth: Authorization: Bearer {WHATSAPP_TOKEN}
USED IN: whatsapp-send Edge Function ONLY — ALL SENDS ARE MANUAL

### Complete Setup
1. business.facebook.com → WhatsApp → API Setup → copy PHONE_NUMBER_ID
2. System Users → create admin system user → assign WhatsApp permission
3. Generate token (permanent) → copy as WHATSAPP_TOKEN
4. Message Templates → Create Template:
   Name: booking_confirmation, Category: UTILITY, Language: English
   Body: "Dear {{1}}, your booking {{2}} is confirmed. Pickup: {{3}}. Balance due: ₹{{4}}. — Echo"
   Name: return_reminder, Body: "Dear {{1}}, please return by {{2}}. Balance: ₹{{3}}. — Echo"
   Name: return_receipt, Body: "Dear {{1}}, items returned successfully. Deposit {{2}}. Thanks! — Echo"
   Name: overdue_notice, Body: "Dear {{1}}, booking {{2}} is overdue since {{3}}. Please return items. — Echo"
5. Submit for Meta approval (24-48h)
6. Store WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Edge Function secrets

### whatsapp-send Edge Function (COMPLETE)
// supabase/functions/whatsapp-send/index.ts
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

### Frontend WhatsApp Button (in booking detail, pickup, return screens)
const sendWA = useMutation({
  mutationFn: async ({ templateType, params }: { templateType:string; params:string[] }) => {
    await supabase.functions.invoke('whatsapp-send', {
      body: { booking_id:booking.id, template_type:templateType, customer_phone:booking.customer.phone, staff_id:staff.id, params }
    })
  },
  onSuccess: () => toast.success('WhatsApp sent!'),
  onError: () => toast.error('WhatsApp failed — check settings')
})

// Usage:
<Button variant="outline" onClick={() => sendWA.mutate({ templateType:'booking_confirmation', params:[customer.name, booking.booking_id_display, formatDate(booking.pickup_date), formatINR(booking.balance_due)] })}>
  <MessageCircle className="w-4 h-4 mr-2" /> Send WhatsApp
</Button>

## API 8: QR CODE API (FREE — NO KEY)
// lib/utils/qr.ts
export const getBookingQR = (id:string, size=80) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=ECHO-BOOKING-${id}&format=png&margin=1`

export const getItemQR = (id:string, size=120) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=ECHO-ITEM-${id}&format=png&margin=1`

export const getVariantQR = (id:string, size=120) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=ECHO-VARIANT-${id}&format=png&margin=1`

export const parseQR = (data:string) => {
  if (data.startsWith('ECHO-BOOKING-')) return { type:'booking' as const, id:data.replace('ECHO-BOOKING-','') }
  if (data.startsWith('ECHO-ITEM-')) return { type:'item' as const, id:data.replace('ECHO-ITEM-','') }
  if (data.startsWith('ECHO-VARIANT-')) return { type:'variant' as const, id:data.replace('ECHO-VARIANT-','') }
  return null
}

### QR Scanner Component (html5-qrcode)
// components/shared/QRScanner.tsx
'use client'
import { useEffect } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'

export function QRScanner({ onScan, onClose }: { onScan:(data:string)=>void; onClose:()=>void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader',
      { fps:10, qrbox:{width:250,height:250}, supportedScanTypes:[Html5QrcodeScanType.SCAN_TYPE_CAMERA] }, false
    )
    scanner.render(
      (decodedText) => { onScan(decodedText); scanner.pause() },
      (err) => {} // ignore errors
    )
    return () => { scanner.clear().catch(console.error) }
  }, [])
  return (
    <div className="p-4">
      <div id="qr-reader" className="w-full max-w-sm mx-auto" />
      <Button variant="outline" onClick={onClose} className="w-full mt-4">Cancel</Button>
    </div>
  )
}

## API 9: BARCODE API (FREE — NO KEY)
export const getBarcodeUrl = (sku:string) =>
  `https://barcodeapi.org/api/128/${encodeURIComponent(sku || 'NO-SKU')}`

// Use in 38mm×25mm QR labels beside the QR code

## API 10: RESEND EMAIL (send-emails Edge Function)
// supabase/functions/send-emails/index.ts
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

  return new Response(JSON.stringify({ success:r.ok }), { headers:{'Content-Type':'application/json'} })
})

## API 11: IP GEOLOCATION (GPS fallback for clock-in)
// Only when navigator.geolocation fails
async function getIPLocation() {
  const r = await fetch('http://ip-api.com/json')
  const d = await r.json()
  if (d.status === 'success') return { lat:d.lat, lng:d.lon, city:d.city }
  return null
}

## process-signup Edge Function
// supabase/functions/process-signup/index.ts
serve(async (req) => {
  const { business_name, owner_name, phone, email, city, business_id, subdomain } = await req.json()
  const KEY = Deno.env.get('RESEND_API_KEY')!
  const TOKEN = Deno.env.get('WHATSAPP_TOKEN')!
  const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
  const ADMIN_PHONE = Deno.env.get('SUPER_ADMIN_PHONE')!
  const loginLink = `https://${subdomain}.echo.app/login`

  // Email to new owner
  await fetch('https://api.resend.com/emails', {
    method:'POST', headers:{'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({ from:'Echo <hello@echo.app>', to:email,
      subject:`Your Echo store is ready — ${business_name}`,
      html:`<div style="font-family:sans-serif;max-width:600px"><div style="background:#CCFF00;padding:24px;text-align:center"><h1 style="margin:0">Echo</h1></div><div style="padding:32px"><h2>Welcome, ${owner_name}!</h2><p>Your store <strong>${business_name}</strong> is live!</p><a href="${loginLink}" style="background:#CCFF00;color:#000;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">Login to Echo →</a><p style="color:#666;font-size:14px;margin-top:24px">Store URL: ${subdomain}.echo.app</p></div></div>`
    })
  })

  // WhatsApp to Ansil
  await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
    method:'POST', headers:{'Authorization':`Bearer ${TOKEN}`,'Content-Type':'application/json'},
    body:JSON.stringify({ messaging_product:'whatsapp', to:ADMIN_PHONE, type:'text',
      text:{ body:`🆕 New Echo signup!\n\nBusiness: ${business_name}\nOwner: ${owner_name}\nPhone: +91${phone}\nCity: ${city}\nEmail: ${email}\nStore: ${subdomain}.echo.app` }
    })
  })

  return new Response(JSON.stringify({ success:true }), { headers:{'Content-Type':'application/json'} })
})

---

# ══════════════════════════════════════════════════════════════
# SECTION 6: COMPLETE DATABASE — ALL 40 TABLES WITH FULL SQL
# ══════════════════════════════════════════════════════════════

-- Run these migrations in order in Supabase SQL Editor

-- ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pgcrypto";

-- ═══ CORE ═══

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text unique not null,
  plan text not null default 'basic', -- basic/pro/enterprise
  status text not null default 'active', -- active/suspended/trial
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);
alter table businesses enable row level security;
create policy "superadmin_businesses" on businesses using (exists (select 1 from staff where id=auth.uid() and role='super_admin'));
create policy "own_business_read" on businesses for select using (id in (select business_id from staff where id=auth.uid() and status='approved'));

create table branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  prefix text not null default 'BRN', -- 3 letters for booking ID
  subdomain_prefix text, -- for subdomain routing
  address text, gst_number text, contact text,
  lat numeric(10,7), lng numeric(10,7),
  logo_url text,
  opening_hours jsonb default '{}', -- { mon:'9:00-18:00', ... }
  settings jsonb default '{}',
  -- settings structure:
  -- { min_advance_pct:30, max_advance_days:180, buffer_days:1,
  --   gps_radius_metres:100, session_expiry_hours:8,
  --   monthly_revenue_target:100000, low_stock_threshold:1,
  --   tier_thresholds:{ silver:5000, gold:15000, platinum:30000 },
  --   sla_hours:{ lehenga:4, saree:2, sherwani:3, suit:2, default:2 },
  --   watermark_enabled:false, watermark_text:'Store Name',
  --   opening_checklist:[{ id:'1', label:'Count cash', required:true }],
  --   print:{ header:'Store Name', footer:'Rental terms...', show_logo:true, font_size:'medium', qr_position:'top', show_store_info:true },
  --   notion_bookings_db:'xxx', notion_inventory_db:'xxx', notion_washing_db:'xxx', notion_expenses_db:'xxx', notion_pl_db:'xxx',
  --   royalty_pct:10 }
  created_at timestamptz default now()
);
alter table branches enable row level security;
create policy "branch_access" on branches using (business_id in (select business_id from staff where id=auth.uid() and status='approved'));

create table staff (
  id uuid primary key references auth.users(id),
  business_id uuid references businesses(id) on delete cascade,
  branch_id uuid references branches(id),
  email text not null,
  name text, phone text,
  role text not null default 'floor_staff', -- super_admin/manager/floor_staff/auditor/custom
  status text not null default 'pending', -- pending/approved/suspended
  custom_permissions jsonb default '{}',
  -- { menu_order:['dashboard','bookings',...], can_override_price:true, can_blacklist:false, can_void_payment:false }
  password_hash text, -- for email login
  pin_hash text, -- for PIN lock
  login_locked_until timestamptz,
  failed_login_count integer default 0,
  push_subscription jsonb, -- PWA push
  setup_completed boolean default false,
  last_login timestamptz,
  created_at timestamptz default now()
);
alter table staff enable row level security;
create policy "own_staff_row" on staff for select using (id=auth.uid());
create policy "manager_see_branch_staff" on staff for select using (branch_id in (select branch_id from staff s2 where s2.id=auth.uid() and s2.role in ('manager','super_admin') and s2.status='approved'));
create policy "superadmin_all_staff" on staff using (exists (select 1 from staff s2 where s2.id=auth.uid() and s2.role='super_admin'));
create policy "manager_update_staff" on staff for update using (branch_id in (select branch_id from staff s2 where s2.id=auth.uid() and s2.role in ('manager','super_admin') and s2.status='approved'));

create table login_attempts (id uuid primary key default gen_random_uuid(), email text not null, ip_address text, success boolean default false, attempted_at timestamptz default now());
alter table login_attempts enable row level security;
-- No policy = only service_role (no staff can read this)

create table password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade,
  token text unique not null default gen_random_uuid()::text,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  used_at timestamptz, created_at timestamptz default now()
);
alter table password_reset_tokens enable row level security;
-- No policy = service_role only

create table signup_requests (
  id uuid primary key default gen_random_uuid(),
  business_name text not null, owner_name text not null,
  phone text not null, email text not null, city text not null,
  rental_type text not null check (rental_type in ('bridal','general','both')),
  status text default 'approved',
  business_id uuid references businesses(id),
  created_at timestamptz default now()
);
alter table signup_requests enable row level security;
create policy "superadmin_signups" on signup_requests using (exists (select 1 from staff where id=auth.uid() and role='super_admin'));
create policy "public_insert_signup" on signup_requests for insert with check (true);

create table billing (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  plan text not null, amount numeric(10,2) not null, currency text default 'INR',
  billing_period_start date, billing_period_end date,
  status text default 'pending', -- pending/paid/overdue/cancelled
  paid_at timestamptz, payment_method text, invoice_url text,
  created_at timestamptz default now()
);
alter table billing enable row level security;
create policy "superadmin_billing" on billing using (exists (select 1 from staff where id=auth.uid() and role='super_admin'));

create table notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  branch_id uuid references branches(id),
  target_staff_id uuid references staff(id),
  type text not null,
  -- approval_pending/overdue/washing_urgent/low_stock/blacklist_attempt/
  -- announcement/tier_upgrade/vendor_overdue/sla_breach/new_signup/
  -- staff_approved/invalid_location_clockin/reconciliation_deficit
  title text not null, body text,
  action_url text, action_type text, -- approve/reject/view
  action_data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "own_notifs_select" on notifications for select using (target_staff_id=auth.uid() or (target_staff_id is null and branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));
create policy "insert_notifs" on notifications for insert with check (true);
create policy "update_own_notifs" on notifications for update using (target_staff_id=auth.uid() or target_staff_id is null);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  branch_id uuid references branches(id),
  staff_id uuid references staff(id),
  action text not null, table_name text not null,
  record_id uuid, old_value jsonb, new_value jsonb,
  timestamp timestamptz default now()
);
alter table audit_log enable row level security;
create policy "superadmin_read_audit" on audit_log for select using (exists (select 1 from staff where id=auth.uid() and role='super_admin'));
create policy "insert_audit" on audit_log for insert with check (staff_id=auth.uid());

create table login_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade,
  status text default 'pending', requested_at timestamptz default now(),
  reviewed_by uuid references staff(id), reviewed_at timestamptz, rejection_reason text
);
alter table login_requests enable row level security;
create policy "own_login_req" on login_requests for select using (staff_id=auth.uid());
create policy "manager_see_requests" on login_requests for select using (exists (select 1 from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));
create policy "manager_update_requests" on login_requests for update using (exists (select 1 from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));

create table opening_checklists (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  staff_id uuid references staff(id),
  date date not null, completed_at timestamptz,
  items jsonb default '[]', created_at timestamptz default now()
);
alter table opening_checklists enable row level security;
create policy "branch_checklists" on opening_checklists using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

-- ═══ CUSTOMERS ═══

create table customers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade not null,
  business_id uuid references businesses(id),
  name text not null, phone text not null, email text,
  aadhaar_front_url text, aadhaar_back_url text,
  tier text default 'bronze', -- bronze/silver/gold/platinum
  risk_score integer default 0 check (risk_score between 0 and 100),
  risk_level text default 'low', -- low/medium/high
  blacklist_level integer default 0 check (blacklist_level between 0 and 3),
  blacklist_reason text, blacklisted_by uuid references staff(id), blacklisted_at timestamptz,
  vip_flag boolean default false, vip_set_by uuid references staff(id),
  loyalty_points integer default 0, debt_amount numeric(10,2) default 0,
  family_group_id uuid, total_spend numeric(10,2) default 0,
  total_bookings integer default 0, avg_booking_value numeric(10,2) default 0,
  created_by uuid references staff(id), created_at timestamptz default now()
);
alter table customers enable row level security;
create policy "branch_customers" on customers using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));
create policy "blacklist_check_all_branches" on customers for select using (
  branch_id in (select branch_id from staff where id=auth.uid() and status='approved')
  or (blacklist_level = 3 and business_id in (select business_id from staff where id=auth.uid() and status='approved'))
);

create table customer_groups (id uuid primary key default gen_random_uuid(), branch_id uuid references branches(id) on delete cascade, name text not null, type text not null);
alter table customer_groups enable row level security;
create policy "branch_groups" on customer_groups using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table customer_group_memberships (customer_id uuid references customers(id) on delete cascade, group_id uuid references customer_groups(id) on delete cascade, primary key(customer_id,group_id));
alter table customer_group_memberships enable row level security;
create policy "branch_memberships" on customer_group_memberships using (customer_id in (select id from customers where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  branch_id uuid references branches(id), family_group_id uuid,
  type text not null check (type in ('earn','redeem','expire')),
  points integer not null, reason text not null,
  booking_id uuid, staff_id uuid references staff(id), created_at timestamptz default now()
);
alter table loyalty_ledger enable row level security;
create policy "branch_loyalty" on loyalty_ledger using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table family_groups (id uuid primary key default gen_random_uuid(), branch_id uuid references branches(id), name text, pool_points boolean default false, created_at timestamptz default now());
alter table family_groups enable row level security;
create policy "branch_family" on family_groups using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table customer_notes (id uuid primary key default gen_random_uuid(), customer_id uuid references customers(id) on delete cascade, content text not null, created_by uuid references staff(id), created_at timestamptz default now(), is_pinned boolean default false);
alter table customer_notes enable row level security;
create policy "staff_insert_cnote" on customer_notes for insert with check (true);
create policy "manager_read_cnotes" on customer_notes for select using (exists (select 1 from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));

create table nps_responses (id uuid primary key default gen_random_uuid(), booking_id uuid, customer_id uuid references customers(id), branch_id uuid references branches(id), score integer not null check (score between 0 and 10), collected_by uuid references staff(id), created_at timestamptz default now());
alter table nps_responses enable row level security;
create policy "branch_nps" on nps_responses using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

-- ═══ INVENTORY ═══

create table items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade not null,
  name text not null, sku text, category text not null, sub_category text,
  condition_grade text default 'A' check (condition_grade in ('A','B','C')),
  status text default 'available',
  -- available/in_booking/in_washing/in_repair/paused/missing/retired/deleted
  price numeric(10,2) not null,
  deposit_pct integer default 20 check (deposit_pct between 0 and 100),
  storage_rack text, storage_shelf text, storage_bay text,
  purchase_date date, purchase_cost numeric(10,2),
  colour_label text, -- text only, no colour picker
  internal_notes text, -- staff only, never printed
  cover_photo_url text,
  completeness_score integer default 0 check (completeness_score between 0 and 100),
  description text, qr_code text, barcode text,
  last_scanned_at timestamptz, last_scanned_by uuid references staff(id),
  notion_page_id text,
  created_by uuid references staff(id), created_at timestamptz default now()
);
alter table items enable row level security;
create policy "branch_items" on items using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade not null,
  size text, colour text, sku text unique, qr_code text, barcode text,
  status text default 'available',
  available_count integer default 1 check (available_count >= 0),
  reserved_count integer default 0 check (reserved_count >= 0),
  created_at timestamptz default now()
);
alter table item_variants enable row level security;
create policy "variants_rls" on item_variants using (item_id in (select id from items where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

-- Stock locking RPC
create or replace function lock_item_stock(p_variant_id uuid, p_quantity integer)
returns void language plpgsql security definer as $$
begin
  update item_variants
  set reserved_count = reserved_count + p_quantity
  where id = p_variant_id
    and (available_count - reserved_count) >= p_quantity;
  if not found then
    raise exception 'Insufficient stock for variant %', p_variant_id
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function unlock_item_stock(p_variant_id uuid, p_quantity integer)
returns void language plpgsql security definer as $$
begin
  update item_variants
  set reserved_count = greatest(0, reserved_count - p_quantity)
  where id = p_variant_id;
end;
$$;

create table item_photos (id uuid primary key default gen_random_uuid(), item_id uuid references items(id) on delete cascade, url text not null, is_cover boolean default false, display_order integer default 0, uploaded_by uuid references staff(id), uploaded_at timestamptz default now());
alter table item_photos enable row level security;
create policy "item_photos_rls" on item_photos using (item_id in (select id from items where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table item_tags (id uuid primary key default gen_random_uuid(), item_id uuid references items(id) on delete cascade, tag_type text not null check (tag_type in ('occasion','fabric','embellishment','custom')), tag_value text not null);
alter table item_tags enable row level security;
create policy "item_tags_rls" on item_tags using (item_id in (select id from items where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table item_collections (id uuid primary key default gen_random_uuid(), branch_id uuid references branches(id) on delete cascade, name text not null);
alter table item_collections enable row level security;
create policy "branch_collections" on item_collections using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table item_collection_memberships (item_id uuid references items(id) on delete cascade, collection_id uuid references item_collections(id) on delete cascade, primary key(item_id,collection_id));
alter table item_collection_memberships enable row level security;
create policy "collection_memberships_rls" on item_collection_memberships using (item_id in (select id from items where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table item_pairings (id uuid primary key default gen_random_uuid(), branch_id uuid references branches(id), primary_item_id uuid references items(id) on delete cascade, paired_item_id uuid references items(id) on delete cascade, created_by uuid references staff(id));
alter table item_pairings enable row level security;
create policy "branch_pairings" on item_pairings using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table item_repairs (id uuid primary key default gen_random_uuid(), item_id uuid references items(id) on delete cascade, vendor_name text, cost numeric(10,2), status text default 'sent' check (status in ('sent','in_progress','returned')), sent_date date, expected_return date, actual_return date, notes text, created_by uuid references staff(id), created_at timestamptz default now());
alter table item_repairs enable row level security;
create policy "item_repairs_rls" on item_repairs using (item_id in (select id from items where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table wishlist (id uuid primary key default gen_random_uuid(), customer_id uuid references customers(id) on delete cascade, item_id uuid references items(id) on delete cascade, branch_id uuid references branches(id), notified boolean default false, notified_at timestamptz, created_at timestamptz default now());
alter table wishlist enable row level security;
create policy "branch_wishlist" on wishlist using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

-- ═══ BOOKINGS ═══

create table bookings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade not null,
  customer_id uuid references customers(id),
  status text not null default 'draft',
  -- draft/confirmed/active/returned/overdue/cancelled
  booking_source text, -- walk_in/whatsapp/referral/phone_call
  occasion text, -- wedding/reception/mehendi/festival/party/other
  pickup_date date not null, return_date date not null,
  total_amount numeric(10,2) not null default 0,
  advance_paid numeric(10,2) default 0,
  deposit_amount numeric(10,2) default 0,
  balance_due numeric(10,2) default 0,
  price_override_amount numeric(10,2), price_override_reason text,
  cctv_timestamp timestamptz, cctv_zone text,
  aadhaar_collected boolean default false,
  aadhaar_front_url text, aadhaar_back_url text,
  high_risk_hold boolean default false,
  approved_by uuid references staff(id),
  created_by uuid references staff(id), created_at timestamptz default now(),
  last_edited_by uuid references staff(id), last_edited_at timestamptz,
  notion_page_id text, booking_id_display text unique
);
alter table bookings enable row level security;
create policy "branch_bookings" on bookings using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table booking_items (id uuid primary key default gen_random_uuid(), booking_id uuid references bookings(id) on delete cascade, item_id uuid references items(id), variant_id uuid references item_variants(id), size text, quantity integer not null default 1 check (quantity>0), daily_rate numeric(10,2) not null, subtotal numeric(10,2) not null, condition_before text check (condition_before in ('excellent','good','damaged','missing')), condition_after text check (condition_after in ('excellent','good','damaged','missing')), before_photo_url text, added_at timestamptz default now());
alter table booking_items enable row level security;
create policy "booking_items_rls" on booking_items using (booking_id in (select id from bookings where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table booking_accessories (id uuid primary key default gen_random_uuid(), booking_id uuid references bookings(id) on delete cascade, accessory_type text not null check (accessory_type in ('dupatta','mojri','jewellery','belt')), given_at_pickup boolean default false, returned_at_return boolean default false, notes text);
alter table booking_accessories enable row level security;
create policy "booking_acc_rls" on booking_accessories using (booking_id in (select id from bookings where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table booking_payments (id uuid primary key default gen_random_uuid(), booking_id uuid references bookings(id) on delete cascade, type text not null check (type in ('advance','balance','deposit','penalty','deposit_refund')), amount numeric(10,2) not null, method text not null check (method in ('cash','upi','bank','store_credit')), reference_number text, staff_id uuid references staff(id), timestamp timestamptz default now(), void_reason text, is_voided boolean default false, voided_by uuid references staff(id), voided_at timestamptz);
alter table booking_payments enable row level security;
create policy "booking_payments_rls" on booking_payments using (booking_id in (select id from bookings where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table booking_notes (id uuid primary key default gen_random_uuid(), booking_id uuid references bookings(id) on delete cascade, content text not null, created_by uuid references staff(id), created_by_name text, created_at timestamptz default now(), is_pinned boolean default false);
alter table booking_notes enable row level security;
create policy "staff_insert_bnote" on booking_notes for insert with check (true);
create policy "manager_read_bnotes" on booking_notes for select using (exists (select 1 from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));
create policy "manager_update_bnotes" on booking_notes for update using (exists (select 1 from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));

create table booking_timeline (id uuid primary key default gen_random_uuid(), booking_id uuid references bookings(id) on delete cascade, event_type text not null, description text, old_value jsonb, new_value jsonb, staff_id uuid references staff(id), staff_name text, timestamp timestamptz default now());
alter table booking_timeline enable row level security;
create policy "branch_timeline" on booking_timeline using (booking_id in (select id from bookings where branch_id in (select branch_id from staff where id=auth.uid() and status='approved')));

create table booking_drafts (id uuid primary key default gen_random_uuid(), branch_id uuid references branches(id) on delete cascade, staff_id uuid references staff(id) on delete cascade, current_step integer default 1 check (current_step between 1 and 6), draft_data jsonb default '{}', created_at timestamptz default now(), updated_at timestamptz default now());
alter table booking_drafts enable row level security;
create policy "own_drafts" on booking_drafts using (staff_id=auth.uid());

-- ═══ OPERATIONS ═══

create table washing_queue (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  item_id uuid references items(id), variant_id uuid references item_variants(id),
  booking_id uuid references bookings(id),
  stage text not null default 'queue',
  -- queue/washing/drying/ironing/qc/ready/removed
  priority text not null default 'normal',
  -- urgent/high/normal/low
  assigned_to uuid references staff(id),
  cost numeric(10,2), notes text,
  is_external boolean default false, external_vendor text,
  vendor_handover_date date, vendor_expected_return date,
  sla_deadline timestamptz,
  entered_at timestamptz default now(), ready_at timestamptz
);
alter table washing_queue enable row level security;
create policy "branch_washing" on washing_queue using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table expenses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  category text not null check (category in ('rent','salary','utility','repair','washing','misc')),
  amount numeric(10,2) not null check (amount > 0),
  description text, receipt_url text,
  staff_id uuid references staff(id), date date not null default current_date,
  is_from_washing boolean default false, washing_queue_id uuid references washing_queue(id),
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "branch_expenses" on expenses using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

create table staff_attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade,
  branch_id uuid references branches(id),
  clock_in timestamptz, clock_out timestamptz,
  clock_in_lat numeric(10,7), clock_in_lng numeric(10,7),
  distance_from_branch numeric(10,2), date date not null,
  is_valid_location boolean default false,
  manager_override boolean default false, manager_override_by uuid references staff(id)
);
alter table staff_attendance enable row level security;
create policy "own_or_manager_attend" on staff_attendance using (staff_id=auth.uid() or exists (select 1 from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));

create table staff_performance_targets (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade, branch_id uuid references branches(id),
  month date not null, revenue_target numeric(10,2), booking_count_target integer,
  created_by uuid references staff(id), created_at timestamptz default now(),
  unique(staff_id, month)
);
alter table staff_performance_targets enable row level security;
create policy "manager_targets" on staff_performance_targets using (branch_id in (select branch_id from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));
create policy "own_targets_read" on staff_performance_targets for select using (staff_id=auth.uid());

create table cash_reconciliation (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade, date date not null,
  expected_amount numeric(10,2), actual_amount numeric(10,2), difference numeric(10,2),
  notes text, counted_by uuid references staff(id),
  approved_by uuid references staff(id), approved_at timestamptz,
  created_at timestamptz default now(), unique(branch_id, date)
);
alter table cash_reconciliation enable row level security;
create policy "manager_reconcile" on cash_reconciliation using (branch_id in (select branch_id from staff where id=auth.uid() and role in ('manager','super_admin') and status='approved'));

create table whatsapp_log (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id), customer_id uuid references customers(id),
  customer_phone text, booking_id uuid references bookings(id), staff_id uuid references staff(id),
  template_type text, message_preview text,
  sent_at timestamptz default now(), status text default 'sent' check (status in ('sent','failed','pending'))
);
alter table whatsapp_log enable row level security;
create policy "branch_wa_log" on whatsapp_log using (branch_id in (select branch_id from staff where id=auth.uid() and status='approved'));

---

# ══════════════════════════════════════════════════════════════
# SECTION 7: ALL UTILITY CODE
# ══════════════════════════════════════════════════════════════

// lib/utils/audit.ts — CALL AFTER EVERY WRITE OPERATION
export async function logAudit(
  action: string, tableName: string, recordId: string | null,
  oldValue: Record<string, unknown> | null, newValue: Record<string, unknown> | null
): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: s } = await supabase.from('staff').select('business_id,branch_id').eq('id',user.id).single()
    await supabase.from('audit_log').insert({
      business_id: s?.business_id, branch_id: s?.branch_id, staff_id: user.id,
      action, table_name: tableName, record_id: recordId,
      old_value: oldValue, new_value: newValue, timestamp: new Date().toISOString()
    })
  } catch { /* never block main operation */ }
}

// lib/utils/formatters.ts
export const formatINR = (n: number): string =>
  new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n)

export const formatDate = (d: Date | string): string =>
  new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', timeZone:'Asia/Kolkata' })

export const formatDateTime = (d: Date | string): string =>
  new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Kolkata' })

export const formatPhone = (p: string): string => {
  const c = p.replace(/\D/g,'').slice(-10)
  return `+91 ${c.slice(0,5)} ${c.slice(5)}`
}

export const validateIndianPhone = (p: string): boolean =>
  /^[6-9]\d{9}$/.test(p.replace(/[\s\-\+91]/g,''))

export const timeAgo = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins/60)}h ago`
  return `${Math.floor(mins/1440)}d ago`
}

// lib/utils/calculations.ts
export const rentalDays = (pickup: Date, ret: Date): number =>
  Math.max(differenceInDays(ret, pickup), 1)

export const calculateRiskScore = (late: number, damage: number, cancel: number, dispute: number) => {
  const score = Math.min((late*25) + (damage*30) + (cancel*15) + (dispute*30), 100)
  return { score, level: score<=25 ? 'low' : score<=60 ? 'medium' : 'high' }
}

export const washingPriority = (nextBookingDate: Date | null): 'urgent'|'high'|'normal'|'low' => {
  if (!nextBookingDate) return 'low'
  const h = differenceInHours(nextBookingDate, new Date())
  return h<=24 ? 'urgent' : h<=48 ? 'high' : h<=96 ? 'normal' : 'low'
}

export const haversineMetres = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3
  const φ1 = lat1*Math.PI/180, φ2 = lat2*Math.PI/180
  const Δφ = (lat2-lat1)*Math.PI/180, Δλ = (lon2-lon1)*Math.PI/180
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export const calculateCompleteness = (item: any, photos: any[], tags: any[]): number => {
  let score = 0
  if (item.cover_photo_url) score += 20
  if (item.description) score += 15
  if (item.sku) score += 10
  if (item.storage_rack) score += 10
  if (item.colour_label) score += 10
  if (tags.length > 0) score += 15
  if (photos.length >= 3) score += 20
  return score
}

export async function generateBookingId(branchId: string, supabase: any): Promise<string> {
  const { data: branch } = await supabase.from('branches').select('prefix').eq('id',branchId).single()
  const today = format(new Date(), 'ddMMyy')
  const todayStart = startOfDay(new Date()).toISOString()
  const { count } = await supabase.from('bookings').select('*',{count:'exact'}).eq('branch_id',branchId).gte('created_at',todayStart)
  return `${branch?.prefix||'BRN'}-${today}-${String((count||0)+1).padStart(3,'0')}`
}

---

# ══════════════════════════════════════════════════════════════
# SECTION 8: MIDDLEWARE + AUTH ROUTES
# ══════════════════════════════════════════════════════════════

// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get:(n)=>req.cookies.get(n)?.value, set:(n,v,o)=>res.cookies.set(n,v,o), remove:(n,o)=>res.cookies.delete(n) } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = req.nextUrl.pathname
  const publicPaths = ['/login','/signup','/auth','/suspended','/pricing']
  const isPublic = publicPaths.some(p => path.startsWith(p)) || path === '/'

  if (!user) {
    if (!isPublic) return NextResponse.redirect(new URL('/login', req.url))
    return res
  }

  const { data: staff } = await supabase.from('staff')
    .select('role, status, setup_completed').eq('id', user.id).single()

  if (!staff) return NextResponse.redirect(new URL('/login', req.url))
  if (staff.status === 'pending') {
    if (!path.startsWith('/pending-approval')) return NextResponse.redirect(new URL('/pending-approval', req.url))
    return res
  }
  if (staff.status === 'suspended') {
    if (!path.startsWith('/suspended')) return NextResponse.redirect(new URL('/suspended', req.url))
    return res
  }
  if (staff.status !== 'approved') return NextResponse.redirect(new URL('/login', req.url))

  if (!staff.setup_completed && !path.startsWith('/setup') && !path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/setup', req.url))
  }

  const role = staff.role
  if (path.startsWith('/analytics') && !['manager','super_admin'].includes(role)) return NextResponse.redirect(new URL('/dashboard', req.url))
  if (path.startsWith('/staff') && !['manager','super_admin'].includes(role)) return NextResponse.redirect(new URL('/dashboard', req.url))
  if (path.startsWith('/franchise') && role !== 'super_admin') return NextResponse.redirect(new URL('/dashboard', req.url))
  if (path.startsWith('/settings/roles') && role !== 'super_admin') return NextResponse.redirect(new URL('/settings', req.url))
  if (path.startsWith('/settings/integrations') && role !== 'super_admin') return NextResponse.redirect(new URL('/settings', req.url))
  if (path.startsWith('/settings/billing') && role !== 'super_admin') return NextResponse.redirect(new URL('/settings', req.url))

  return res
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|public|sounds).*)'] }

// app/api/auth/login/route.ts — Email login with rate limiting
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{autoRefreshToken:false,persistSession:false} })

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const ago15 = new Date(Date.now()-15*60*1000).toISOString()
  const { count:fails } = await admin.from('login_attempts').select('*',{count:'exact'}).eq('email',email).eq('success',false).gte('attempted_at',ago15)
  if ((fails||0)>=5) return NextResponse.json({ error:'Account locked for 15 minutes.', code:'LOCKED' }, { status:429 })
  const { data:s } = await admin.from('staff').select('id,password_hash,status,setup_completed,name,role').eq('email',email.toLowerCase()).single()
  const fail = async () => { await admin.from('login_attempts').insert({ email, ip_address:ip, success:false }) }
  if (!s?.password_hash) { await fail(); return NextResponse.json({ error:`No account. ${5-(fails||0)-1} attempts left.`, code:'NOT_FOUND' }, { status:401 }) }
  if (!await bcrypt.compare(password, s.password_hash)) { await fail(); return NextResponse.json({ error:`Wrong password. ${5-(fails||0)-1} attempts left.`, code:'WRONG_PASSWORD' }, { status:401 }) }
  if (s.status === 'suspended') return NextResponse.json({ error:'Account suspended.', code:'SUSPENDED' }, { status:403 })
  if (s.status === 'pending') return NextResponse.json({ error:'Awaiting approval.', code:'PENDING' }, { status:403 })
  await admin.from('login_attempts').insert({ email, ip_address:ip, success:true })
  await admin.from('staff').update({ last_login:new Date().toISOString() }).eq('id',s.id)
  const { data:{ session } } = await admin.auth.admin.createSession(s.id)
  return NextResponse.json({ success:true, session, setup_completed:s.setup_completed, role:s.role })
}

---

# ══════════════════════════════════════════════════════════════
# SECTION 9: ZUSTAND STORES
# ══════════════════════════════════════════════════════════════

// lib/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Staff { id:string; email:string; name:string; role:string; branch_id:string; business_id:string; status:string }

export const useAuthStore = create<{
  staff: Staff | null; isLocked: boolean; pin: string | null
  setStaff:(s:Staff|null)=>void; lock:()=>void; unlock:(p:string)=>boolean; setPin:(p:string)=>void; clearAuth:()=>void
}>()(persist((set,get) => ({
  staff: null, isLocked: false, pin: null,
  setStaff: (staff) => set({ staff }),
  lock: () => set({ isLocked: true }),
  unlock: (p) => { if (p===get().pin){set({isLocked:false});return true}; return false },
  setPin: (pin) => set({ pin }),
  clearAuth: () => set({ staff:null, isLocked:false, pin:null })
}), { name:'echo-auth', partialize:(s) => ({ pin:s.pin }) }))

// lib/stores/bookingStore.ts
interface SelectedItem { itemId:string; variantId:string; size:string; quantity:number; dailyRate:number; itemName:string; itemPhoto:string }
interface BookingState {
  currentStep:number; customer:any|null; selectedItems:SelectedItem[]
  pickupDate:Date|null; returnDate:Date|null; rentalDays:number
  totalAmount:number; priceOverride:number|null; priceOverrideReason:string|null
  advance:number; deposit:number; method1:string; amount1:number; method2:string|null; amount2:number
  bookingSource:string; occasion:string; draftId:string|null
}
export const useBookingStore = create<BookingState & {
  setStep:(s:number)=>void; setCustomer:(c:any)=>void
  addItem:(i:SelectedItem)=>void; removeItem:(id:string,vid:string,size:string)=>void
  setDates:(p:Date,r:Date,d:number)=>void; setPricing:(t:number,o:number|null,r:string|null)=>void
  setPayment:(p:Partial<BookingState>)=>void; clearBooking:()=>void; setDraftId:(id:string|null)=>void
}>()((set) => ({
  currentStep:1, customer:null, selectedItems:[], pickupDate:null, returnDate:null, rentalDays:1,
  totalAmount:0, priceOverride:null, priceOverrideReason:null, advance:0, deposit:0,
  method1:'cash', amount1:0, method2:null, amount2:0, bookingSource:'walk_in', occasion:'wedding', draftId:null,
  setStep:(s)=>set({currentStep:s}), setCustomer:(c)=>set({customer:c}),
  addItem:(i)=>set(s=>({selectedItems:[...s.selectedItems,i]})),
  removeItem:(id,vid,size)=>set(s=>({selectedItems:s.selectedItems.filter(x=>!(x.itemId===id&&x.variantId===vid&&x.size===size))})),
  setDates:(p,r,d)=>set({pickupDate:p,returnDate:r,rentalDays:d}),
  setPricing:(t,o,r)=>set({totalAmount:t,priceOverride:o,priceOverrideReason:r}),
  setPayment:(p)=>set(p), clearBooking:()=>set({currentStep:1,customer:null,selectedItems:[],pickupDate:null,returnDate:null,rentalDays:1,totalAmount:0,priceOverride:null,priceOverrideReason:null,advance:0,deposit:0,method1:'cash',amount1:0,method2:null,amount2:0,bookingSource:'walk_in',occasion:'wedding',draftId:null}),
  setDraftId:(id)=>set({draftId:id})
}))

// lib/stores/uiStore.ts
export const useUiStore = create<{
  sidebarCollapsed:boolean; pageTitle:string; liveRevenue:number
  setSidebarCollapsed:(v:boolean)=>void; setPageTitle:(t:string)=>void; addLiveRevenue:(n:number)=>void
}>()((set) => ({
  sidebarCollapsed: false, pageTitle: 'Dashboard', liveRevenue: 0,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed:v }),
  setPageTitle: (t) => set({ pageTitle:t }),
  addLiveRevenue: (n) => set(s=>({ liveRevenue:s.liveRevenue+n }))
}))

---

# ══════════════════════════════════════════════════════════════
# SECTION 10: BOOKING CONFIRMATION — ALL 12 OPERATIONS
# ══════════════════════════════════════════════════════════════

async function confirmBooking(data: ReturnType<typeof useBookingStore.getState>, staff: Staff, supabase: any): Promise<string> {
  // OP 1: Generate booking_id_display
  const bookingIdDisplay = await generateBookingId(staff.branch_id, supabase)
  const finalAmount = data.priceOverride ?? data.totalAmount

  // OP 2: Insert booking
  const { data: booking, error } = await supabase.from('bookings').insert({
    branch_id: staff.branch_id, customer_id: data.customer!.id,
    status: 'confirmed', booking_source: data.bookingSource, occasion: data.occasion,
    pickup_date: format(data.pickupDate!, 'yyyy-MM-dd'), return_date: format(data.returnDate!, 'yyyy-MM-dd'),
    total_amount: finalAmount, advance_paid: data.advance, deposit_amount: data.deposit,
    balance_due: finalAmount - data.advance,
    price_override_amount: data.priceOverride, price_override_reason: data.priceOverrideReason,
    high_risk_hold: data.customer?.risk_level === 'high',
    created_by: staff.id, last_edited_by: staff.id, last_edited_at: new Date().toISOString(),
    booking_id_display: bookingIdDisplay
  }).select().single()
  if (error || !booking) throw new Error('Failed to create booking: ' + error?.message)

  // OP 3: Insert booking_items
  for (const item of data.selectedItems) {
    await supabase.from('booking_items').insert({
      booking_id: booking.id, item_id: item.itemId, variant_id: item.variantId,
      size: item.size, quantity: item.quantity, daily_rate: item.dailyRate,
      subtotal: item.dailyRate * item.quantity * data.rentalDays
    })
  }

  // OP 4: Insert 4 booking_accessories
  for (const type of ['dupatta','mojri','jewellery','belt']) {
    await supabase.from('booking_accessories').insert({ booking_id: booking.id, accessory_type: type })
  }

  // OP 5: Insert advance payment
  if (data.advance > 0) {
    await supabase.from('booking_payments').insert({
      booking_id: booking.id, type: 'advance', amount: data.advance,
      method: data.method1, staff_id: staff.id
    })
    if (data.method2 && data.amount2 > 0) {
      await supabase.from('booking_payments').insert({
        booking_id: booking.id, type: 'advance', amount: data.amount2,
        method: data.method2, staff_id: staff.id
      })
    }
  }

  // OP 6: Insert deposit payment
  if (data.deposit > 0) {
    await supabase.from('booking_payments').insert({
      booking_id: booking.id, type: 'deposit', amount: data.deposit,
      method: data.method1, staff_id: staff.id
    })
  }

  // OP 7: Log to booking_timeline
  await supabase.from('booking_timeline').insert({
    booking_id: booking.id, event_type: 'BOOKING_CREATED',
    description: `Booking created by ${staff.name}`,
    staff_id: staff.id, staff_name: staff.name ?? ''
  })

  // OP 8: Log to audit_log
  await logAudit('CREATE_BOOKING', 'bookings', booking.id, null, { booking_id_display: bookingIdDisplay, status:'confirmed' })

  // OP 9: Notion sync (fire and forget)
  supabase.functions.invoke('notion-sync', { body:{ type:'booking_created', booking_id:booking.id } }).catch(console.error)

  // OP 10: Clear draft
  if (data.draftId) await supabase.from('booking_drafts').delete().eq('id', data.draftId)

  // OP 11: Update customer stats
  await supabase.rpc('increment_customer_stats', { p_customer_id:data.customer!.id, p_amount:finalAmount })
  // Create this RPC function in SQL:
  // create or replace function increment_customer_stats(p_customer_id uuid, p_amount numeric)
  // returns void language plpgsql as $$
  // begin
  //   update customers set total_bookings=total_bookings+1, total_spend=total_spend+p_amount,
  //   avg_booking_value=total_spend/total_bookings where id=p_customer_id;
  // end;$$;

  // OP 12: Check and update customer tier
  await updateCustomerTier(data.customer!.id, supabase)

  return booking.id
}

async function updateCustomerTier(customerId: string, supabase: any) {
  const { data: c } = await supabase.from('customers').select('total_spend,tier,branch_id').eq('id',customerId).single()
  const { data: branch } = await supabase.from('branches').select('settings').eq('id',c.branch_id).single()
  const t = branch.settings?.tier_thresholds || { silver:5000, gold:15000, platinum:30000 }
  let newTier = 'bronze'
  if (c.total_spend >= t.platinum) newTier = 'platinum'
  else if (c.total_spend >= t.gold) newTier = 'gold'
  else if (c.total_spend >= t.silver) newTier = 'silver'
  if (newTier !== c.tier) {
    await supabase.from('customers').update({ tier:newTier }).eq('id',customerId)
    await supabase.from('notifications').insert({
      branch_id: c.branch_id, type:'tier_upgrade',
      title:'Customer Tier Upgraded',
      body:`Customer upgraded to ${newTier.toUpperCase()}`
    })
  }
}

---

# ══════════════════════════════════════════════════════════════
# SECTION 11: CRON JOBS SETUP
# ══════════════════════════════════════════════════════════════

-- Run in Supabase SQL Editor to set up pg_cron schedules

-- 1. Overdue check: every day at midnight IST (18:30 UTC)
SELECT cron.schedule(
  'echo-overdue-daily',
  '30 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_ID].supabase.co/functions/v1/cron-overdue',
    headers := '{"Authorization":"Bearer [YOUR_SERVICE_ROLE_KEY]","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 2. Royalty calculation: 1st of each month at 23:30 IST (18:00 UTC)
SELECT cron.schedule(
  'echo-royalty-monthly',
  '0 18 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_ID].supabase.co/functions/v1/cron-royalty',
    headers := '{"Authorization":"Bearer [YOUR_SERVICE_ROLE_KEY]","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 3. Monthly Notion sync (expenses + washing): 2nd of each month
SELECT cron.schedule(
  'echo-notion-monthly',
  '0 19 2 * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_ID].supabase.co/functions/v1/notion-sync',
    headers := '{"Authorization":"Bearer [YOUR_SERVICE_ROLE_KEY]","Content-Type":"application/json"}'::jsonb,
    body := '{"type":"monthly_expenses"}'::jsonb
  );
  $$
);

-- cron-overdue Edge Function
// supabase/functions/cron-overdue/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const today = new Date().toISOString().split('T')[0]
  const { data:bookings } = await supabase.from('bookings')
    .select('id,branch_id,booking_id_display,customers(name)')
    .in('status',['confirmed','active']).lt('return_date',today)

  for (const b of bookings||[]) {
    await supabase.from('bookings').update({ status:'overdue' }).eq('id',b.id)
    await supabase.from('booking_timeline').insert({
      booking_id:b.id, event_type:'STATUS_CHANGED',
      description:'Auto-marked overdue by system',
      old_value:{status:'active'}, new_value:{status:'overdue'}
    })
    await supabase.from('notifications').insert({
      branch_id:b.branch_id, type:'overdue',
      title:'Booking Overdue',
      body:`${b.booking_id_display} — ${(b.customers as any)?.name} is overdue`,
      action_url:`/bookings/${b.id}`
    })
  }
  return new Response(JSON.stringify({processed:bookings?.length||0}), {headers:{'Content-Type':'application/json'}})
})

// cron-royalty Edge Function
// supabase/functions/cron-royalty/index.ts
serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const lm = new Date(); lm.setMonth(lm.getMonth()-1)
  const start = new Date(lm.getFullYear(),lm.getMonth(),1).toISOString().split('T')[0]
  const end = new Date(lm.getFullYear(),lm.getMonth()+1,0).toISOString().split('T')[0]
  const { data:branches } = await supabase.from('branches').select('id,business_id,settings')
  for (const branch of branches||[]) {
    const pct = branch.settings?.royalty_pct||0; if(!pct) continue
    const { data:payments } = await supabase.from('booking_payments').select('amount')
      .in('type',['advance','balance']).eq('is_voided',false)
      .gte('timestamp',start).lte('timestamp',end+'T23:59:59Z')
      .in('booking_id', supabase.from('bookings').select('id').eq('branch_id',branch.id))
    const revenue = payments?.reduce((s:number,p:any)=>s+p.amount,0)||0
    if (revenue>0) await supabase.from('billing').insert({
      business_id:branch.business_id, plan:'royalty',
      amount:revenue*(pct/100), billing_period_start:start, billing_period_end:end, status:'pending'
    })
  }
  return new Response(JSON.stringify({success:true}), {headers:{'Content-Type':'application/json'}})
})

---

# ══════════════════════════════════════════════════════════════
# SECTION 12: ENVIRONMENT VARIABLES
# ══════════════════════════════════════════════════════════════

# .env.local (Next.js frontend — git-ignored)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
NEXT_PUBLIC_APP_URL=https://echo.app
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]

# Supabase Edge Function Secrets (Dashboard → Edge Functions → Manage secrets)
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
NOTION_TOKEN=[notion_integration_token]
WHATSAPP_TOKEN=[meta_permanent_token]
WHATSAPP_PHONE_NUMBER_ID=[phone_number_id]
RESEND_API_KEY=[resend_api_key]
SUPER_ADMIN_PHONE=91[ansil_10_digit_number]
SUPER_ADMIN_EMAIL=[ansil_email]

# vercel.json
{
  "rewrites": [{
    "source": "/:path*",
    "has": [{ "type": "host", "value": "(?<subdomain>[^.]+)\\.echo\\.app" }],
    "destination": "/:path*"
  }],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]
  }]
}

---

# ══════════════════════════════════════════════════════════════
# SECTION 13: FULL PRINT SYSTEM — 68mm THERMAL
# ══════════════════════════════════════════════════════════════

Printer: Vyapar VYPRTP3001 (3-inch / 68mm / 80mm paper)

CSS:
  @page { size: 80mm auto; margin: 0; }
  @media print { body { width: 80mm; } .no-print { display:none; } }

Preview width: 302px (80mm at 96dpi)

// components/shared/PrintReceipt.tsx
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

export function BookingReceipt({ booking, branch }: { booking:any; branch:any }) {
  const ref = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ content:()=>ref.current, pageStyle:'@page{size:80mm auto;margin:0}@media print{body{width:80mm}}' })

  return (
    <>
      <div ref={ref} style={{ width:302, fontFamily:'monospace', fontSize:11, padding:8, background:'white' }}>
        {/* Store header */}
        {branch.logo_url && <img src={branch.logo_url} style={{ width:60, margin:'0 auto 8px', display:'block' }} />}
        <div style={{ textAlign:'center', fontWeight:'bold', fontSize:14 }}>{branch.name}</div>
        <div style={{ textAlign:'center', fontSize:9 }}>{branch.gst_number} | {branch.contact}</div>
        <div style={{ borderTop:'1px dashed #000', margin:'6px 0' }} />

        {/* Booking ID + QR */}
        <div style={{ textAlign:'center', fontWeight:'bold', fontSize:13 }}>Booking: {booking.booking_id_display}</div>
        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=ECHO-BOOKING-${booking.id}&format=png`}
          style={{ display:'block', margin:'8px auto', width:80, height:80 }} />
        <div style={{ borderTop:'1px dashed #000', margin:'6px 0' }} />

        {/* Customer */}
        <div>Customer: {booking.customer.name}</div>
        <div>Phone: +91 {booking.customer.phone.slice(-10)}</div>
        <div style={{ borderTop:'1px dashed #000', margin:'6px 0' }} />

        {/* Items */}
        <div style={{ fontWeight:'bold' }}>Items:</div>
        {booking.booking_items.map((bi:any) => (
          <div key={bi.id} style={{ display:'flex', justifyContent:'space-between' }}>
            <span>{bi.item.name} ({bi.size}×{bi.quantity})</span>
            <span>₹{bi.subtotal}</span>
          </div>
        ))}
        <div style={{ borderTop:'1px dashed #000', margin:'6px 0' }} />

        {/* Dates */}
        <div>Pickup: {booking.pickup_date}</div>
        <div>Return: {booking.return_date}</div>
        <div style={{ borderTop:'1px dashed #000', margin:'6px 0' }} />

        {/* Payment */}
        <div style={{ display:'flex', justifyContent:'space-between' }}><span>Advance:</span><span>₹{booking.advance_paid}</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span>Deposit (Refundable):</span><span>₹{booking.deposit_amount}</span></div>
        <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'bold' }}><span>Balance Due:</span><span>₹{booking.balance_due}</span></div>
        <div style={{ borderTop:'1px dashed #000', margin:'6px 0' }} />

        {/* Terms */}
        <div style={{ fontSize:8, textAlign:'center' }}>{branch.settings?.print?.footer || 'Items must be returned in original condition.'}</div>
      </div>
      <button onClick={handlePrint} className="no-print bg-[#CCFF00] text-black font-bold px-4 py-2 rounded-lg">
        Print Receipt
      </button>
    </>
  )
}

// QR Label for items (38mm × 25mm)
export function ItemQRLabel({ item, variant }: { item:any; variant:any }) {
  const ref = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ content:()=>ref.current, pageStyle:'@page{size:38mm 25mm;margin:0}@media print{body{width:38mm}}' })
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ECHO-VARIANT-${variant.id}&format=png`
  const barcodeUrl = `https://barcodeapi.org/api/128/${encodeURIComponent(variant.sku||item.sku||item.id.slice(0,8))}`
  return (
    <>
      <div ref={ref} style={{ width:143, height:94, display:'flex', gap:4, padding:4, fontFamily:'monospace', fontSize:8 }}>
        <img src={qrUrl} style={{ width:80, height:80 }} />
        <div style={{ flex:1 }}>
          <img src={barcodeUrl} style={{ width:'100%', height:30 }} />
          <div style={{ fontWeight:'bold', fontSize:9 }}>{variant.sku||item.sku||'No SKU'}</div>
          <div>{item.storage_rack && `Rack ${item.storage_rack}`} {item.storage_shelf && `/ Shelf ${item.storage_shelf}`}</div>
          <div style={{ fontSize:7 }}>{item.name.slice(0,20)}</div>
        </div>
      </div>
      <button onClick={handlePrint} className="no-print">Print Label</button>
    </>
  )
}

---

# ══════════════════════════════════════════════════════════════
# SECTION 14: ALL FEATURES — NEVER BUILD THESE
# ══════════════════════════════════════════════════════════════

No AI features | No coupon system | No seasonal pricing
No measurement tracking (show empty tab with "coming soon")
No referral codes | No birthday automation | No re-engagement automation
No digital signature (physical receipt only)
No max wash count tracking | No washing photos
No quality rating for washing | No machine tracking | No chemicals tracking
No washing queue export | No auto WhatsApp (100% manual)
No SMS fallback | No PDF for booking detail (thermal receipt only)
No staff leaderboard | No payroll (empty tab: "managed externally")
No shift scheduling | No handover system
No off-season status | No supplier tracking | No insurance tracking
No colour swatches (text labels only) | No installment plans
No gift bookings | No ROI calculation | No return time slot (date only)
No AI outfit/size suggestions | No commission tracking
No multi-occasion per booking | No rebook/repeat feature

---

# ══════════════════════════════════════════════════════════════
# SECTION 15: BUILD ORDER + HOW TO START EVERY SESSION
# ══════════════════════════════════════════════════════════════

## Build Phases
Phase 1 — Foundation (Build first, everything else depends on this):
  1. Run all database migrations in Supabase SQL Editor
  2. Generate TypeScript types: npx supabase gen types typescript --project-id [ID] > types/supabase.ts
  3. Build middleware.ts
  4. Build Auth screens (login, pending-approval, signup, reset-password)
  5. Build app/(dashboard)/layout.tsx (Sidebar + TopBar + PinLock + OfflineBanner)
  6. Build Settings module (branch settings, print settings)

Phase 2 — Core Operations:
  7. Build Bookings (6-step wizard + list + detail + pickup + return)
  8. Build Inventory (list + detail + quick add + variants + CSV import)
  9. Build Washing Queue (stage columns + realtime)

Phase 3 — Business Intelligence:
  10. Build Customers (table list + slide-over + risk + tiers)
  11. Build Payments (transaction list + reconciliation)
  12. Build Analytics (all 6 reports with Recharts + TanStack Table)
  13. Build Staff (table + detail + GPS clock-in)

Phase 4 — Scale:
  14. Build Expenses, Calendar, Franchise, Notifications
  15. Build Landing Page + Signup Form + Setup Wizard
  16. Deploy all 6 Edge Functions
  17. Set up pg_cron schedules
  18. Deploy to Vercel + configure custom domain

## Every Session Start
1. Read this entire CLAUDE.md
2. Run: ls -la (check codebase state)
3. Run: ls supabase/migrations/ (check existing migrations)
4. Run: npm run build (fix any existing errors first)
5. Never rebuild what already exists
6. Build ONE complete feature at a time: schema → RLS → types → API → UI → audit log
7. Run: npm run build after every module (zero errors before moving on)
8. If TanStack Query stale or errors: check queryKey matches invalidation key

## Common Pitfalls to Avoid
- Forgetting logAudit() on any write operation
- Missing RLS policy on a new table
- Not invalidating the correct queryKey after mutation
- Hardcoding branchId instead of reading from auth session
- Forgetting to handle offline state in form submissions
- Not compressing images before upload
- Using spinner instead of Skeleton
- Making WhatsApp send automatic instead of manual

*Echo CLAUDE.md v7.0 GODMODE — Owner: Ansil — Confidential*
*Save as CLAUDE.md in c:\echo\ — Claude Code auto-loads this every session*