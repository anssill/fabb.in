# FABB.BOOKING — FULL PRODUCT REQUIREMENTS DOCUMENT
# Version 1.0 | Owner: Ansil | Confidential
# India-First Clothing Rental Management SaaS
# Target: 100,000+ words | Complete specification

---

# ══════════════════════════════════════════════════════════════════════
# PART 1: EXECUTIVE SUMMARY
# ══════════════════════════════════════════════════════════════════════

## 1.1 Product Overview

Fabb.booking is a production-grade, multi-tenant, Software-as-a-Service (SaaS) platform built
exclusively for clothing rental businesses across India. It is the digital operating system
that replaces fragmented tools — WhatsApp message threads, Excel spreadsheets, paper ledgers,
and manual cash books — with a single unified platform that manages every aspect of a clothing
rental business from the moment a customer walks in to the moment they return the outfit.

The product is inspired by Booqable, the internationally acclaimed rental management platform,
but is redesigned from the ground up for the Indian market — with support for INR currency,
GST invoicing, India-specific item categories (kurtha, suits, loafers, shoes, caps,
accessories), Indian phone number validation, and SMS-based customer notifications via
Indian SMS providers.

Fabb.booking is not just a booking system. It is a full-stack business management platform
covering: inventory management with size variants, multi-step booking creation, pickup and
return flows, washing queue management, customer profiles with booking history, payment
tracking with advance-deposit-balance collection, PDF invoice generation, detailed analytics
and reporting, staff management with GPS clock-in, settings with complete business
customisation, and a Super Admin panel for Ansil to manage all registered businesses.

The platform is designed to be as intuitive as Booqable — clean white interface, blue accent
colors, Inter font, shadcn/ui components throughout — so that any staff member can learn it
within their first day of use.

## 1.2 Business Problem Being Solved

Indian clothing rental businesses face specific operational challenges that no existing
software adequately addresses:

PROBLEM 1 — No centralized booking system:
Businesses take bookings via WhatsApp, phone calls, or walk-ins. There is no single system
tracking who has booked what, when they're picking up, when they're returning, and how much
they've paid. Staff rely on memory or scattered notes.

PROBLEM 2 — Stock confusion:
When the same kurtha set exists in sizes S, M, L, and XL with 2 units each, knowing which
sizes are available on a specific date requires mental math or paper tracking. Double-bookings
happen regularly causing customer disappointment and business losses.

PROBLEM 3 — Payment tracking is manual:
Advance is collected at booking, balance at pickup, deposit held until return. Tracking
which customers owe what, and which deposits need to be returned, is done via cash books
that are error-prone and time-consuming to reconcile.

PROBLEM 4 — Overdue items not tracked:
When a customer doesn't return on time, there's no automated alert. Staff forget to follow
up. Items stay out for extra days with no additional charge collected.

PROBLEM 5 — No professional invoices:
Indian businesses need GST-compliant invoices. Currently, rental businesses write receipts
by hand or use generic billing apps not designed for rental workflows.

PROBLEM 6 — Washing and maintenance tracking:
After items are returned, they need to go through a washing/cleaning cycle before being
available again. There's no tracking system — items get forgotten in the washing pile and
accidentally booked before they're ready.

PROBLEM 7 — Staff accountability:
When multiple staff handle bookings and payments, there's no audit trail. Cash discrepancies,
booking errors, and item losses are difficult to trace.

## 1.3 Solution

Fabb.booking solves all seven problems with purpose-built modules:

1. Centralized bookings — 6-step wizard capturing every detail
2. Real-time stock tracking — size-wise availability by date
3. Payment lifecycle — advance → pickup balance → deposit → return settlement
4. Overdue alerts — automated daily checks with staff notifications
5. GST PDF invoices — professional A4 invoices downloadable instantly
6. Washing queue — In Washing → Ready two-stage tracking
7. Full audit log — every action logged with staff identity and timestamp

## 1.4 Target Customers

PRIMARY: Clothing rental businesses in Kerala, Tamil Nadu, Karnataka, and Maharashtra
  - Bridal rental shops (lehenga, saree, sherwani for weddings)
  - Men's formal rental (suits, sherwanis, jodhpuri for functions)
  - Ethnic wear rental (kurtha sets for festivals, occasions)

SECONDARY: Rental businesses in Tier 2 cities across India
  - Any business renting kurtha, suits, loafers, shoes, caps, accessories

BUSINESS SIZE: 1 to 10 staff members, 50 to 2000 inventory items, 1 to 5 branches

## 1.5 Business Model

Pricing: Custom pricing only (no displayed plans)
Contact: Potential customers contact Ansil directly via WhatsApp or the signup form
Trial: Businesses get instant access after self-registration
Billing: Handled by Ansil manually (bank transfer, UPI)

Revenue streams:
  - Monthly subscription per business (custom negotiated)
  - Potential future: per-branch add-ons, advanced analytics tier

## 1.6 Success Metrics

Year 1 targets:
  - 50 active businesses on the platform
  - Average 200 bookings per business per month
  - Zero downtime SLA (Vercel + Supabase Cloud Mumbai)
  - NPS score > 50 among active businesses

---

# ══════════════════════════════════════════════════════════════════════
# PART 2: PRODUCT VISION AND GOALS
# ══════════════════════════════════════════════════════════════════════

## 2.1 Vision Statement

Fabb.booking will be the Booqable of India — the definitive rental management platform
that every clothing rental business uses, from the smallest single-location shop in
Thrissur to a multi-branch franchise operation in Mumbai. It will be so embedded in
the daily operations of these businesses that switching away would be unthinkable.

## 2.2 Core Product Principles

PRINCIPLE 1 — Simplicity over features:
Every feature must earn its place. If a staff member cannot understand a feature
within 30 seconds of seeing it, it is too complex. No feature is added just because
it's possible to build it.

PRINCIPLE 2 — India-first, not India-as-afterthought:
Currency is ₹ INR everywhere. Time is IST. Phone numbers are Indian 10-digit format.
GST is supported in all invoices. Payment methods are Cash, UPI, Bank Transfer — the
methods that Indian businesses actually use.

PRINCIPLE 3 — Staff must trust the data:
If staff don't trust that the system accurately reflects reality (correct stock counts,
correct payment balances, correct booking status), they'll stop using it. Every operation
must be atomic — either it fully succeeds or fully fails with a clear error message.

PRINCIPLE 4 — Booqable quality, Indian pricing:
The UX quality should match or exceed Booqable. Clean white interface, logical navigation,
predictable interactions. Businesses should feel they're using a premium professional tool.

PRINCIPLE 5 — Zero downtime is non-negotiable:
Rental businesses are busiest on weekends and evenings — wedding seasons, festival times.
The platform must be operational 99.9% of the time. Supabase Cloud Mumbai + Vercel Edge
provides this reliability.

## 2.3 Product Goals for v1.0

GOAL 1 — Complete booking lifecycle:
A staff member can create a booking, process pickup, process return, and close the booking
entirely within the platform. No step requires pen and paper.

GOAL 2 — Real-time inventory:
Stock counts are always accurate. When a booking is confirmed, stock is locked. When
returned, stock is freed. No double-bookings are physically possible.

GOAL 3 — Professional invoices:
Every booking generates a GST-compliant A4 PDF invoice that can be downloaded, printed,
or shared digitally.

GOAL 4 — Multi-business management:
Ansil can manage all registered businesses from a single Super Admin panel, creating staff
accounts, viewing business data, and generating aggregate reports.

GOAL 5 — Mobile-first operation:
Staff with phones should be able to perform any operation. The interface renders perfectly
on 375px screens and larger.

---

# ══════════════════════════════════════════════════════════════════════
# PART 3: SYSTEM ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════

## 3.1 Architecture Overview

Fabb.booking follows a modern full-stack architecture:

Frontend:
  Next.js 14+ (App Router) hosted on Vercel
  All UI built with shadcn/ui components
  TanStack Query for server state management
  Zustand for client-side global state

Backend:
  Supabase (PostgreSQL) for database
  Supabase Auth for authentication
  Supabase Storage for file storage
  Supabase Edge Functions for server-side logic
  Supabase Realtime for live updates

Infrastructure:
  Vercel (CDN + Edge Network) for frontend
  Supabase Cloud Mumbai (ap-south-1) for backend
  GitHub for version control + CI/CD

## 3.2 Multi-Tenancy Architecture

Fabb.booking uses SINGLE-DOMAIN multi-tenancy (different from subdomain-based).

All businesses access the same URL: fabb.com
Data isolation is enforced at the DATABASE level via Supabase Row Level Security (RLS).

Every table has a business_id column.
Every RLS policy filters by business_id derived from the authenticated user's staff record.
No code-level filtering is relied upon — if RLS is disabled on any table, that's a
critical security bug.

The tenant hierarchy:
  Super Admin (Ansil)
    └── Business 1 (e.g., Raj Bridal Collections)
         ├── Branch 1 (Thrissur)
         │    ├── Staff 1 (Owner - Raj)
         │    ├── Staff 2 (Manager - Priya)
         │    └── Staff 3 (Floor Staff - Ahmed)
         └── Branch 2 (Kochi)
              └── Staff 4 (Manager - Fatima)
    └── Business 2 (e.g., Kerala Fashion Rentals)
         └── Branch 1 (Calicut)
              └── Staff 5 (Owner - Rahul)

Business A staff see ONLY Business A data.
Business B staff see ONLY Business B data.
Super Admin (Ansil) sees ALL businesses.

## 3.3 Authentication Flow

FLOW 1 — Email + Password Login:
  1. User visits fabb.com/login
  2. Enters email + password
  3. /api/auth/login route: checks login_attempts table for rate limiting
  4. Fetches staff record by email
  5. Compares bcrypt hash
  6. Creates Supabase session via admin.createSession()
  7. Returns session to client
  8. Client stores session in cookies via @supabase/ssr
  9. Middleware checks session on every request
  10. User redirected to dashboard

FLOW 2 — Google OAuth Login:
  1. User clicks "Continue with Google"
  2. supabase.auth.signInWithOAuth({ provider: 'google' })
  3. Redirect to Google for authentication
  4. Google redirects to fabb.com/auth/callback?code=xxx
  5. Route exchanges code for session
  6. Checks if staff record exists for this Google email
  7. If found + active: redirect to dashboard
  8. If not found: show "Account not found. Contact your admin." error
  9. If suspended: redirect to suspended screen

FLOW 3 — New Business Signup:
  1. Business owner visits fabb.com/signup
  2. Fills signup form (business name, owner name, email, phone, city)
  3. /api/signup route: creates businesses record + default branch + owner staff record
  4. Creates Supabase auth user
  5. Redirects to setup wizard
  6. Owner completes 5-step setup wizard
  7. After setup: redirect to dashboard

## 3.4 Data Flow

Every request through the system follows this path:

1. Browser request → Vercel Edge
2. Next.js middleware: check auth session → if no session → /login
3. Middleware: check staff.status = active → if suspended → /suspended
4. Middleware: check role-based route access
5. Server Component: fetch data from Supabase (server-side, uses cookies for auth)
6. Supabase: RLS policies filter data by business_id/branch_id automatically
7. Data returned to Server Component → rendered as HTML
8. Client hydration: TanStack Query takes over for subsequent fetches and mutations
9. Client mutations: go through Supabase JS client → RLS enforced again at DB level

## 3.5 Real-Time Architecture

Supabase Realtime provides WebSocket-based live updates.

Channels subscribed in Fabb.booking:

Channel 1 — bookings:
  Listens: INSERT, UPDATE, DELETE on bookings table
  Filter: business_id=eq.{current_business_id}
  Updates: dashboard booking stats, booking list, schedule widget

Channel 2 — washing_queue:
  Listens: INSERT, UPDATE on washing_queue table
  Filter: branch_id=eq.{current_branch_id}
  Updates: washing queue UI in real-time

Channel 3 — booking_payments:
  Listens: INSERT on booking_payments table
  Updates: live revenue counter on dashboard, payment history

Channel 4 — notifications:
  Listens: INSERT on notifications table
  Filter: target_staff_id=eq.{current_user_id}
  Updates: notification bell badge, inbox

## 3.6 File Storage Architecture

Supabase Storage buckets:

images bucket (PUBLIC):
  Purpose: Item photos, staff profile photos, business logos
  Access: Public URL (CDN-served, no auth required to view)
  Path pattern: images/{business_id}/{item_id}/{timestamp}.jpg
  Max size per file: 5MB
  Accepted types: image/jpeg, image/png, image/webp

documents bucket (PRIVATE):
  Purpose: ID proof photos (Aadhaar), invoices PDF
  Access: Signed URLs only (1-24 hour expiry)
  Path pattern: documents/{business_id}/{booking_id}/{type}.jpg
  Max size per file: 10MB

---

# ══════════════════════════════════════════════════════════════════════
# PART 4: COMPLETE TECH STACK — EVERY LIBRARY EXPLAINED
# ══════════════════════════════════════════════════════════════════════

## 4.1 Next.js 14+ (App Router)

WHY: Server Components reduce JavaScript sent to browser. Middleware runs on edge for
fast auth checks. App Router provides nested layouts (sidebar stays rendered while
page content changes). Built-in image optimization for item photos.

ROUTE GROUPS USED:
  (auth) → login, signup pages (no sidebar)
  (dashboard) → all app pages (with sidebar + header)
  (landing) → marketing pages (different layout)
  (admin) → super admin panel

KEY PATTERNS:
  Server Components for initial data fetch (no loading flash)
  'use client' only where state/effects needed (forms, interactive UI)
  generateMetadata() for SEO on landing and signup pages
  Route handlers in app/api/ for email login, signup, PDF generation

## 4.2 TailwindCSS

WHY: Utility-first. Mobile-first with sm: md: lg: xl: breakpoints. animate-pulse for
skeleton loading. No separate CSS files needed. Consistent design system via tailwind.config.

KEY USAGE:
  Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
  Cards: rounded-lg border bg-card text-card-foreground shadow-sm
  Buttons: shadcn/ui handles button styles
  Tables: shadcn/ui Table component with Tailwind customization
  Dark mode: dark: prefix on all colors

## 4.3 shadcn/ui — USED FOR EVERYTHING

WHY: Booqable uses clean white card-based UI. shadcn/ui provides exactly this —
accessible, unstyled-by-default Radix components with Tailwind styling. Professional
look out of the box. Full TypeScript support.

CRITICAL RULE: If shadcn/ui has a component for something, USE IT. Don't build custom.

Complete component usage map:

Button:
  default variant → blue bg, white text (primary actions)
  outline variant → border, transparent bg (secondary actions)
  ghost variant → no border, no bg (icon buttons)
  destructive variant → red bg (delete, cancel actions)
  sizes: sm (h-8), default (h-9), lg (h-10), icon (h-9 w-9)

Input:
  All text inputs throughout the app
  Error state: border-destructive with error message below
  Prefix/suffix: wrapper div with icon and input side by side

Label:
  All form field labels (above inputs)
  Font: text-sm font-medium

Card:
  CardHeader, CardContent, CardFooter
  Used for: stat cards, booking cards, item cards, settings sections

Table:
  TableHeader, TableBody, TableRow, TableHead, TableCell
  Used for: bookings list, inventory list, customers, payments, staff, audit log
  Striped: alternate row bg in light mode

Dialog:
  DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter
  Used for: add payment modal, edit booking modal, confirm delete, PIN setup
  Max widths: sm (384px), md (448px), lg (512px), xl (576px)

Sheet:
  SheetTrigger, SheetContent, SheetHeader, SheetTitle
  Position: right (slide from right)
  Used for: booking detail on mobile, filter panels, notification inbox

Tabs:
  TabsList, TabsTrigger, TabsContent
  Used for: booking detail (5 tabs), item detail (5 tabs), settings navigation,
  analytics reports

Select:
  SelectTrigger, SelectContent, SelectItem, SelectGroup
  Used for: all dropdowns (role, category, status filter, sort, branch)

Badge:
  variant: default (blue), secondary (gray), destructive (red), outline
  Used for: booking status, item status, role display, category

Progress:
  Used for: payment completion bar, inventory completeness, performance targets

Avatar:
  AvatarImage, AvatarFallback
  Used for: staff photos/initials throughout (sidebar, staff list, booking created by)

Skeleton:
  Used for: ALL loading states — never spinners, never loading text
  Pattern: Skeleton className="h-4 w-full" for text rows

Switch:
  Used for: all toggle settings in settings pages

Checkbox:
  Used for: bulk select in lists, accessory checklists

Form (react-hook-form integration):
  Form, FormField, FormControl, FormLabel, FormMessage
  Used for: ALL forms with validation

Calendar:
  Used for: date pickers in booking wizard

Popover:
  Used for: date picker wrapper, filter dropdowns

Command:
  Used for: search within dropdowns (item search, customer search)

Tooltip:
  Used for: icon buttons (show label on hover), collapsed sidebar items

Alert:
  AlertTitle, AlertDescription
  Used for: warning banners, info messages within pages

AlertDialog:
  Used for: ALL destructive confirmations (cancel booking, delete item, suspend staff)
  ALWAYS use this for irreversible actions

NavigationMenu:
  Used for: landing page main navigation

Breadcrumb:
  Used for: settings page navigation (Company → Branch Settings)

Pagination:
  Used for: long lists (bookings, inventory, customers)

Separator:
  Used for: visual dividers in forms, cards, sidebars

ScrollArea:
  Used for: long dropdowns, notification list, sidebar when items overflow

## 4.4 Zustand

WHY: Lightweight (1KB gzipped). No boilerplate. TypeScript-native. Persist to
localStorage for theme preference and PIN.

STORES:

authStore:
  state: staff (Staff | null), isAuthenticated, businessId, branchId, role
  actions: setStaff, clearAuth, setBusinessId

bookingWizardStore:
  state: currentStep (1-6), customer, selectedItems, pickupDate, returnDate,
         rentalDays, pricingMode, baseTotal, overrideTotal, overrideReason,
         payments (advance, deposit, method), bookingSource, occasion, draftId
  actions: setStep, setCustomer, addItem, removeItem, setDates, setPricing,
           setPayment, clearWizard, setDraftId, saveDraft

uiStore:
  state: sidebarCollapsed, activeTheme, pageTitle, activeBranchId
  actions: toggleSidebar, setTheme, setPageTitle, setActiveBranch

## 4.5 TanStack Query v5

WHY: Automatic caching. Background refetching. Infinite scroll. Optimistic updates.
Mutation loading states. Cache invalidation on data changes.

SETUP in app/providers.tsx:
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, gcTime: 300_000, retry: 2 },
      mutations: { retry: 0 }
    }
  })

KEY PATTERNS:

useQuery for single resource:
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBooking(bookingId)
  })

useInfiniteQuery for paginated lists:
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['bookings', businessId, filters],
    queryFn: ({ pageParam = 0 }) => fetchBookings({ offset: pageParam }),
    getNextPageParam: (last) => last.hasMore ? last.nextOffset : undefined,
    initialPageParam: 0
  })

useMutation for data changes:
  const createBooking = useMutation({
    mutationFn: (data) => supabase.from('bookings').insert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Booking created!')
    },
    onError: (err) => toast.error(err.message)
  })

## 4.6 React Hook Form + Zod

WHY: Zero re-renders on typing. Type-safe validation matching TypeScript types.
Best performance of any form library in React ecosystem.

PATTERN used in all forms:
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid Indian mobile number'),
    email: z.string().email('Enter valid email address'),
    amount: z.number().positive('Amount must be positive')
  })
  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

## 4.7 date-fns + date-fns-tz

WHY: Immutable, tree-shakeable, comprehensive date library. IST timezone support
via date-fns-tz.

KEY FUNCTIONS used in Fabb.booking:
  format(date, 'dd MMM yyyy') → "26 Mar 2026" (display format)
  format(date, 'yyyy-MM-dd') → "2026-03-26" (DB storage format)
  format(date, 'dd/MM/yy') → "26/03/26" (booking ID date part)
  differenceInDays(returnDate, pickupDate) → rental duration
  differenceInHours(returnDate, now()) → overdue hours
  addDays(date, n) → next available date after buffer
  startOfDay(date) → for date-based queries
  toZonedTime(utcDate, 'Asia/Kolkata') → convert UTC to IST for display
  isAfter(date1, date2) → overdue check

## 4.8 Recharts

WHY: React-native chart library. Responsive. Customizable. Good TypeScript support.
Clean design matches Booqable-style UI.

CHARTS used in Fabb.booking:
  BarChart → Revenue by day/week/month on dashboard and analytics
  LineChart → Revenue trend over time in analytics
  PieChart → Payment method breakdown, booking source breakdown
  AreaChart → Booking volume over time

All charts: ResponsiveContainer wrapper, height 200-280px, no animations (performance)

## 4.9 TanStack Table

WHY: Headless. Full control over rendering. Sorting, filtering, pagination built-in.
TypeScript-native. Used with shadcn/ui Table for visual rendering.

TABLES in Fabb.booking:
  Bookings list: sortable by date, amount, status
  Inventory list: sortable by name, category, price, stock
  Customers list: sortable by name, spend, last booking
  Payments list: sortable by date, amount, type
  Staff list: sortable by name, role, status
  Audit log: sortable by timestamp, action, staff

## 4.10 @react-pdf/renderer

WHY: Generate PDF invoices entirely in React. Client-side or server-side. A4 format.
Full control over layout and styling. No server dependency for PDF generation.

PDF DOCUMENTS generated:
  Booking Invoice: A4, GST compliant, with business header and rental details
  Payment Receipt: A4, for each payment collected
  Damage Report: A4, for damaged items on return

PDF Font: Helvetica (built-in, no font loading needed)
PDF colors: Match Fabb.booking brand (blue #2563eb)

## 4.11 @dnd-kit

WHY: Accessible drag-and-drop. Touch support (mobile). Better than react-beautiful-dnd.

USED FOR:
  Item photo reordering in inventory (drag photos to set display order)
  Dashboard widget reordering (manager customizes dashboard layout)

## 4.12 react-dropzone

WHY: Handles file drag-and-drop + click-to-upload. File type and size validation.
Works with react-image-crop for image editing.

USED FOR:
  Item photo upload in inventory
  Business logo upload in settings
  Staff profile photo upload

## 4.13 browser-image-compression

WHY: Reduces file size 70-90% client-side before upload. Saves Supabase Storage costs.
Faster uploads on mobile networks.

SETTINGS: maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true

USED FOR: All image uploads before sending to Supabase Storage

## 4.14 html5-qrcode

WHY: Browser-based QR scanner using device camera. No native app needed. Works on
all modern mobile browsers.

USED FOR:
  Scan item QR code in booking Step 2 to add item to cart
  Scan booking QR code at pickup to load booking

## 4.15 framer-motion

WHY: Production-quality animations. Gesture support. Layout animations.

USED FOR:
  Slide-overs: x from 400 to 0 on mount (shadcn Sheet)
  Modal entrance: scale 0.95 to 1.0 (shadcn Dialog)
  Page transitions: opacity 0 to 1
  Notification bell: spring animation when new notification arrives
  Step transitions in booking wizard: x slide between steps

## 4.16 sonner

WHY: Beautiful, minimal toasts. Works with Next.js App Router.

SETUP: <Toaster richColors position="top-right" /> in root layout

USAGE:
  toast.success('Booking created successfully')
  toast.error('Failed to create booking. Try again.')
  toast.loading('Generating invoice...')
  toast('Item returned', { action: { label: 'Undo', onClick: handleUndo }, duration: 5000 })

## 4.17 lucide-react

WHY: 1000+ icons. Tree-shakeable. Consistent style. TypeScript-native.

KEY ICONS used:
  LayoutDashboard → Dashboard nav
  CalendarCheck → Bookings nav
  Package → Inventory nav
  Users → Customers nav
  CreditCard → Payments nav
  BarChart3 → Analytics nav
  UserCheck → Staff nav
  Settings → Settings nav
  Bell → Notifications bell
  Plus → Add buttons
  Search → Search inputs
  ChevronDown / ChevronRight → Dropdowns, accordions
  Edit2 → Edit actions
  Trash2 → Delete actions
  Eye / EyeOff → Password toggle
  Download → PDF download
  Printer → Print buttons
  ArrowLeft / ArrowRight → Back/next navigation
  X → Close/cancel buttons
  Check → Success states
  AlertTriangle → Warning states
  Info → Info states

## 4.18 bcryptjs

WHY: Industry-standard password hashing. Works in Node.js without native modules.

USAGE:
  Hash: await bcrypt.hash(password, 12) → store in staff.password_hash
  Compare: await bcrypt.compare(inputPassword, storedHash) → boolean

Salt rounds: 12 (strong security, ~300ms per hash — acceptable for login)

---

# ══════════════════════════════════════════════════════════════════════
# PART 5: DESIGN SYSTEM — FULL SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 5.1 Visual Direction

Fabb.booking follows Booqable's visual language:
  - Clean white backgrounds (no dark by default)
  - Subtle gray borders and backgrounds for cards
  - Blue as the primary action color
  - Consistent 8px spacing grid
  - Rounded corners (8px / 0.5rem)
  - No heavy shadows (shadow-sm only)
  - Data-dense tables with clear hierarchy

## 5.2 Color System

PRIMARY BLUE: #2563eb (blue-600)
  Used: Primary buttons, active nav items, links, focus rings, selected states,
        booking status "Booked", primary badge backgrounds

PRIMARY HOVER: #1d4ed8 (blue-700)
  Used: Button hover state

PRIMARY LIGHT: #eff6ff (blue-50)
  Used: Active sidebar item background (light mode), selected row tint,
        info alert background

NEUTRAL PALETTE (Slate):
  slate-950 (#0f172a) → Dark mode page bg, primary text in dark
  slate-900 (#0f172a) → Primary text in light mode
  slate-800 (#1e293b) → Dark mode card/sidebar bg
  slate-700 (#334155) → Dark mode borders
  slate-600 (#475569) → Secondary text in dark
  slate-500 (#64748b) → Secondary text in light
  slate-400 (#94a3b8) → Placeholder text, muted text
  slate-300 (#cbd5e1) → Light mode borders (subtle)
  slate-200 (#e2e8f0) → Light mode borders (default)
  slate-100 (#f1f5f9) → Light mode hover states, subtle bg
  slate-50 (#f8fafc) → Light mode page background

STATUS COLORS:
  Pending: amber-500 (#f59e0b) bg, amber-700 text
  Booked: blue-500 (#3b82f6) bg, white text
  Out: violet-500 (#8b5cf6) bg, white text
  Returned: emerald-500 (#10b981) bg, white text
  Closed: slate-500 (#64748b) bg, white text
  Overdue: red-500 (#ef4444) bg, white text

## 5.3 Typography — Inter Font

Font: Inter (Google Fonts)
Setup in app/layout.tsx:
  import { Inter } from 'next/font/google'
  const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap'
  })

Type scale:
  text-xs (12px) → metadata, timestamps, helper text
  text-sm (14px) → table cell content, form labels, secondary info
  text-base (16px) → body text, default
  text-lg (18px) → card titles, section headers
  text-xl (20px) → page titles
  text-2xl (24px) → dashboard stat values
  text-3xl (30px) → large numbers on analytics

Font weights:
  font-normal (400) → body text
  font-medium (500) → labels, secondary headings, table headers
  font-semibold (600) → card titles, nav items, stat labels
  font-bold (700) → page titles, critical values

## 5.4 Spacing System

Based on 4px/8px grid (Tailwind defaults):
  p-1 (4px) → tight spacing
  p-2 (8px) → compact elements
  p-3 (12px) → card internal padding (sm)
  p-4 (16px) → standard card padding, form field gaps
  p-5 (20px) → section padding
  p-6 (24px) → card padding (standard), modal padding
  p-8 (32px) → large section padding
  gap-4 (16px) → standard flex/grid gap
  gap-6 (24px) → section spacing

## 5.5 Border Radius

rounded-sm (4px) → small chips, tight badges
rounded (6px) → small buttons (sm size)
rounded-md (8px) → default (most buttons, most cards)
rounded-lg (12px) → larger cards, modals
rounded-xl (16px) → prominent cards, signup form
rounded-full → circular avatars, pill badges

## 5.6 Shadows

shadow-none → dark mode cards (use border instead)
shadow-sm → light mode cards, dropdowns
shadow → modals when open
shadow-lg → floating elements (dropdown menus)

## 5.7 Layout Specifications

SIDEBAR:
  Width expanded: 240px
  Width collapsed: 64px (icon only)
  Position: fixed left-0 top-0 bottom-0 z-40
  Light: bg-white border-r border-slate-200
  Dark: bg-slate-800 border-r border-slate-700

HEADER:
  Height: 56px (h-14)
  Position: fixed top-0 right-0 z-30 (left = sidebar width)
  Light: bg-white border-b border-slate-200
  Dark: bg-slate-800 border-b border-slate-700
  Contains: page title, search, branch selector, notifications, user menu

CONTENT AREA:
  Margin-left: sidebar width (240px or 64px)
  Padding-top: header height (56px)
  Padding: p-6 on desktop, p-4 on mobile
  Max-width: none (full width within margins)

PAGE HEADER (below sticky header, inside content):
  Pattern: page title (text-xl font-semibold) + action button right-aligned
  Border-bottom separates from content on some pages

## 5.8 Interactive States

Hover: bg changes (slate-50 in light, slate-700/50 in dark)
Focus: ring-2 ring-blue-500 ring-offset-2 (shadcn/ui default)
Active/Selected: bg-blue-50 text-blue-700 (light) / bg-blue-950 text-blue-300 (dark)
Disabled: opacity-50 cursor-not-allowed
Loading: skeleton animation (animate-pulse)

## 5.9 Responsive Breakpoints

All designs are mobile-first (min-width breakpoints):
  Default (0px) → mobile, single column, full-width
  sm (640px) → small tablet, 2-column grids start
  md (768px) → tablet, sidebar appears, more columns
  lg (1024px) → desktop, full layout
  xl (1280px) → wide desktop, maximum content width

Mobile-specific patterns:
  Sidebar: hidden by default, opens as full-screen overlay via hamburger menu
  Tables: scroll horizontally instead of collapsing
  Modals: full-screen on mobile (Sheet from bottom)
  Stat cards: 2 columns on mobile, 4 on desktop

---

# ══════════════════════════════════════════════════════════════════════
# PART 6: ALL EXTERNAL APIS — COMPLETE SETUP AND INTEGRATION
# ══════════════════════════════════════════════════════════════════════

## 6.1 Supabase Auth API

Base URL: https://[PROJECT_ID].supabase.co/auth/v1
Documentation: supabase.com/docs/guides/auth
SDK: @supabase/supabase-js (handles all auth calls)

GOOGLE OAUTH SETUP:
Step 1: Google Cloud Console
  a. console.cloud.google.com → Select or create project
  b. APIs & Services → Enable "Google People API" and "Google+ API"
  c. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
  d. Application type: Web application
  e. Name: "Fabb.booking Production"
  f. Authorized JavaScript origins:
     - https://fabb.com
     - http://localhost:3000 (development)
  g. Authorized redirect URIs:
     - https://[SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
     - http://localhost:54321/auth/v1/callback (development)
  h. Create → copy Client ID and Client Secret

Step 2: Supabase Dashboard
  a. Project → Authentication → Providers
  b. Find Google → Enable toggle
  c. Paste Client ID and Client Secret from Step 1
  d. Redirect URL shown: copy it (used in Google console)
  e. Save

Step 3: Code (frontend)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) toast.error(error.message)
  }

Step 4: Callback route (app/auth/callback/route.ts)
  export async function GET(request: NextRequest) {
    const code = new URL(request.url).searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    const supabase = createServerClient(...)
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !session) return NextResponse.redirect(new URL('/login?error=auth', request.url))
    const { data: staffRecord } = await supabase.from('staff')
      .select('status, role, setup_completed, business_id, branch_id')
      .eq('email', session.user.email!).single()
    if (!staffRecord) return NextResponse.redirect(new URL('/login?error=no_account', request.url))
    if (staffRecord.status === 'suspended') return NextResponse.redirect(new URL('/suspended', request.url))
    await supabase.from('staff').update({ last_login: new Date().toISOString() }).eq('id', staffRecord.id)
    if (!staffRecord.setup_completed && staffRecord.role === 'owner')
      return NextResponse.redirect(new URL('/setup', request.url))
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

EMAIL LOGIN RATE LIMITING:
  Track in login_attempts table: email + ip_address + timestamp + success
  Count failures in last 15 minutes
  After 5 failures: return 429 error with lockout message
  After success: reset counter (insert success=true)

## 6.2 Supabase Database API (PostgREST)

Base URL: https://[PROJECT_ID].supabase.co/rest/v1
SDK: @supabase/supabase-js (never call PostgREST directly)

KEY PATTERNS:

Pattern 1 — Simple fetch:
  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_number, status, pickup_date, return_date')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

Pattern 2 — Deep joins (related data):
  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(id, name, phone),
      booking_items(
        id, quantity, daily_rate, subtotal,
        item:items(id, name, sku, cover_image_url),
        item_variant:item_variants(id, size, colour)
      ),
      booking_payments(id, type, amount, method, created_at),
      created_by_staff:staff!created_by(name)
    `)
    .eq('id', bookingId)
    .single()

Pattern 3 — Filtered list with count:
  const { data, count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .eq('status', 'out')
    .range(offset, offset + 19)

Pattern 4 — Upsert (insert or update):
  await supabase
    .from('booking_drafts')
    .upsert({ id: draftId, staff_id: staffId, draft_data: JSON.stringify(state) })
    .eq('id', draftId)

Pattern 5 — RPC (stored function):
  const { error } = await supabase.rpc('lock_item_stock', {
    p_variant_id: variantId,
    p_quantity: quantity
  })

## 6.3 Supabase Realtime

Base URL: wss://[PROJECT_ID].supabase.co/realtime/v1
Documentation: supabase.com/docs/guides/realtime

Complete dashboard setup:
  useEffect(() => {
    const client = createClient()
    const channel = client
      .channel('dashboard-live')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `business_id=eq.${businessId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'booking_payments'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['revenue', 'today'] })
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `target_staff_id=eq.${staffId}`
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        toast(payload.new.title, { description: payload.new.body })
      })
      .subscribe()
    return () => { client.removeChannel(channel) }
  }, [businessId, staffId])

## 6.4 Supabase Storage

Base URL: https://[PROJECT_ID].supabase.co/storage/v1
Buckets to create in Supabase Dashboard → Storage:

images bucket:
  Name: images
  Public: YES (items browsable without auth)
  File size limit: 5MB
  Allowed types: image/jpeg, image/png, image/webp

documents bucket:
  Name: documents
  Public: NO (requires signed URL)
  File size limit: 10MB
  Allowed types: image/jpeg, image/png, application/pdf

Complete upload flow (with compression):
  import imageCompression from 'browser-image-compression'
  async function uploadItemImage(file: File, itemId: string, businessId: string) {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    })
    const ext = file.name.split('.').pop()
    const path = `${businessId}/items/${itemId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, compressed, { contentType: file.type })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
    return publicUrl
  }

## 6.5 Supabase Edge Functions

Base URL: https://[PROJECT_ID].supabase.co/functions/v1
Runtime: Deno

Call from frontend:
  await supabase.functions.invoke('send-sms', {
    body: { to: phone, message: `Booking confirmed: ${bookingNumber}` }
  })
  await supabase.functions.invoke('generate-invoice', {
    body: { booking_id: bookingId }
  })

## 6.6 SMS API — MSG91 (India)

WHY MSG91: India's leading SMS API. Used by Paytm, Razorpay, etc. Low latency for
Indian networks. Reliable OTP and transactional SMS delivery.

Base URL: https://api.msg91.com/api/v5
Auth: authkey header with API key

SETUP:
Step 1: msg91.com → create account → verify mobile
Step 2: Add sender ID (e.g., FABBKG) — takes 1-3 days to get approved
Step 3: Create SMS templates (mandatory for transactional SMS in India):
  Template 1: "Dear {#name#}, your booking {#booking_id#} is confirmed at {#business_name#}. Pickup: {#date#}. - Fabb.booking"
  Template 2: "Dear {#name#}, please return items for booking {#booking_id#} by {#date#}. - Fabb.booking"
  Template 3: "Your booking {#booking_id#} is overdue. Please contact {#business_name#} immediately. - Fabb.booking"
Step 4: Get API key from Dashboard → API Keys → Create key
Step 5: Store MSG91_API_KEY + MSG91_SENDER_ID in Supabase Edge Function secrets

Edge Function (supabase/functions/send-sms/index.ts):
  import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
  serve(async (req) => {
    const { to, template_id, variables } = await req.json()
    const API_KEY = Deno.env.get('MSG91_API_KEY')!
    const SENDER = Deno.env.get('MSG91_SENDER_ID')!
    const phone = to.replace(/\D/g,'').startsWith('91') ? to.replace(/\D/g,'') : `91${to.replace(/\D/g,'')}`
    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authkey': API_KEY },
      body: JSON.stringify({
        flow_id: template_id,
        sender: SENDER,
        mobiles: phone,
        ...variables
      })
    })
    const result = await response.json()
    // Log to sms_log table
    await supabase.from('sms_log').insert({
      phone, template_id, variables: JSON.stringify(variables),
      status: response.ok ? 'sent' : 'failed',
      response: JSON.stringify(result)
    })
    return new Response(JSON.stringify({ success: response.ok }), {
      headers: { 'Content-Type': 'application/json' }
    })
  })

SMS sent events (ALL MANUAL — staff taps Send SMS button):
  - Booking confirmed
  - Pickup reminder (day before)
  - Return reminder (day before return date)
  - Overdue notice

Frontend SMS button:
  <Button
    variant="outline"
    size="sm"
    onClick={() => sendSMS.mutate({ to: customer.phone, template: 'booking_confirmed', vars: {...} })}
  >
    <MessageSquare className="w-4 h-4 mr-2" />
    Send SMS
  </Button>

## 6.7 Resend Email API

WHY: For system emails (business signup confirmation, staff invite emails, invoice delivery).
Not for customer notifications (SMS is used for customers).

Base URL: https://api.resend.com
Documentation: resend.com/docs

SETUP:
1. resend.com → create account → create API key
2. Add domain fabb.com (verify DNS: TXT, MX, DKIM records)
3. Store RESEND_API_KEY in Edge Function secrets

EMAILS SENT:
  a. Business signup confirmation: "Welcome to Fabb.booking — your account is ready"
  b. Staff invitation: "You've been added to [Business Name] on Fabb.booking"
  c. Invoice email: "Your invoice from [Business Name] — booking [ID]"
  d. Password reset: "Reset your Fabb.booking password"

All from: noreply@fabb.com
Templates: React Email or HTML templates

## 6.8 PDF Generation — @react-pdf/renderer

WHY: A4 GST-compliant invoices. Entirely client or server-side. No external service needed.

PDF INVOICE STRUCTURE:

Page: A4 (595pt × 842pt), margins 40pt all sides

HEADER:
  Left: Business logo (50×50) + Business name (18pt bold) + GST number
  Right: "RENTAL INVOICE" (14pt, blue) + Invoice # + Invoice Date

DIVIDER: 1pt blue line

PARTIES:
  Left "From": Business address, phone, email
  Right "To": Customer name, phone, city

BOOKING DETAILS:
  Booking ID | Pickup Date | Return Date | Total Days
  (2×2 grid with borders)

ITEMS TABLE:
  Headers: Item Description | Size | Days | Rate/Day | Subtotal
  Rows: each item in booking
  Footer row: Subtotal, Advance Paid, Deposit Held, Balance Due (if any)

PAYMENT SUMMARY:
  "Payments Collected" table:
  Date | Method | Amount | Type
  (advance, balance, deposit)

GST SECTION (if GST enabled):
  Taxable Amount: ₹X
  CGST (9%): ₹X
  SGST (9%): ₹X
  Total GST: ₹X
  Total with GST: ₹X

TERMS:
  Rental terms text from business settings

FOOTER:
  "Generated by Fabb.booking" + date + page number

Edge Function for PDF generation (supabase/functions/generate-invoice/index.ts):
  import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
  serve(async (req) => {
    const { booking_id } = await req.json()
    // Fetch all booking data
    // Generate PDF using @react-pdf/renderer (server-side)
    // Upload to documents bucket
    // Return signed URL
  })


# ══════════════════════════════════════════════════════════════════════
# PART 7: COMPLETE DATABASE SCHEMA — ALL TABLES, COLUMNS, RLS POLICIES
# ══════════════════════════════════════════════════════════════════════

## 7.1 Schema Design Principles

Every table in Fabb.booking follows these rules without exception:

1. All primary keys are UUID (gen_random_uuid()) — no auto-increment integers
2. All tables have created_at timestamptz default now()
3. All tables with business-scoped data have business_id uuid column
4. Row Level Security (RLS) enabled on every table — no exceptions
5. Foreign keys with ON DELETE CASCADE where child records should die with parent
6. ON DELETE RESTRICT where child records must be resolved first (data integrity)
7. All text fields that will be filtered/searched have appropriate indexes
8. All timestamps stored as timestamptz (with timezone) in UTC — displayed in IST

## 7.2 Complete SQL — Run in Order in Supabase SQL Editor

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════
-- TABLE 1: businesses
-- Root table for multi-tenancy
-- ═══════════════════════════════════════════
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid,
  email text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  country text not null default 'India',
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  gst_number text,
  pan_number text,
  logo_url text,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'trial', 'churned')),
  trial_ends_at timestamptz,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table businesses is 'Root tenant table. Every business is one row here.';
comment on column businesses.slug is 'URL-safe business identifier e.g. raj-bridal-collections';
comment on column businesses.settings is 'Business-wide settings JSONB blob';

alter table businesses enable row level security;

create policy "superadmin_full_access_businesses" on businesses
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "own_business_read" on businesses
  for select using (
    id in (select business_id from staff where id = auth.uid() and status = 'active')
  );

create policy "owner_update_business" on businesses
  for update using (
    id in (select business_id from staff where id = auth.uid()
           and role in ('owner', 'super_admin') and status = 'active')
  );

create index idx_businesses_slug on businesses(slug);
create index idx_businesses_status on businesses(status);

-- ═══════════════════════════════════════════
-- TABLE 2: branches
-- Each business can have multiple branches
-- ═══════════════════════════════════════════
create table branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  prefix text not null default 'BRN',
  gst_number text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  gps_radius_metres integer not null default 100,
  opening_hours jsonb not null default '{}',
  is_default boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table branches is 'One or more physical locations per business';
comment on column branches.prefix is '3-letter code used in booking numbers e.g. TRT for Thrissur';
comment on column branches.settings is 'Branch-specific settings: booking rules, invoice config, SMS config, etc.';

alter table branches enable row level security;

create policy "superadmin_full_access_branches" on branches
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "branch_access_by_business" on branches
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create policy "owner_manager_update_branch" on branches
  for update using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

create index idx_branches_business_id on branches(business_id);

-- ═══════════════════════════════════════════
-- TABLE 3: staff
-- All users of the system (owner, manager, staff)
-- ═══════════════════════════════════════════
create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  email text not null,
  name text,
  phone text,
  role text not null default 'staff'
    check (role in ('super_admin', 'owner', 'manager', 'staff')),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'invited')),
  password_hash text,
  pin_hash text,
  profile_photo_url text,
  setup_completed boolean not null default false,
  last_login timestamptz,
  login_locked_until timestamptz,
  failed_login_attempts integer not null default 0,
  permissions jsonb not null default '{}',
  push_subscription jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table staff is 'All system users. Includes super_admin (Ansil), business owners, managers, and floor staff.';
comment on column staff.permissions is 'Custom permission overrides for this staff member';
comment on column staff.pin_hash is 'Bcrypt hash of 4-digit PIN for screen lock feature';

alter table staff enable row level security;

create policy "superadmin_full_access_staff" on staff
  using (exists (select 1 from staff s2 where s2.id = auth.uid() and s2.role = 'super_admin'));

create policy "own_staff_row_read" on staff
  for select using (id = auth.uid());

create policy "same_business_staff_read" on staff
  for select using (
    business_id in (
      select business_id from staff s2 where s2.id = auth.uid()
      and s2.role in ('owner', 'manager') and s2.status = 'active'
    )
  );

create policy "owner_manager_update_staff" on staff
  for update using (
    business_id in (
      select business_id from staff s2 where s2.id = auth.uid()
      and s2.role in ('owner', 'manager', 'super_admin') and s2.status = 'active'
    )
  );

create policy "insert_own_staff" on staff
  for insert with check (id = auth.uid());

create index idx_staff_business_id on staff(business_id);
create index idx_staff_email on staff(email);
create index idx_staff_role on staff(role);
create index idx_staff_status on staff(status);

-- ═══════════════════════════════════════════
-- TABLE 4: login_attempts
-- Rate limiting for email login
-- ═══════════════════════════════════════════
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_address text,
  user_agent text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

alter table login_attempts enable row level security;
-- No RLS policies = only service_role can access (used in API route with admin client)

create index idx_login_attempts_email on login_attempts(email);
create index idx_login_attempts_attempted_at on login_attempts(attempted_at);

-- ═══════════════════════════════════════════
-- TABLE 5: password_reset_tokens
-- One-time password reset tokens
-- ═══════════════════════════════════════════
create table password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table password_reset_tokens enable row level security;
-- No RLS policies = only service_role can access

-- ═══════════════════════════════════════════
-- TABLE 6: customers
-- Customer profiles (name + phone only per spec)
-- ═══════════════════════════════════════════
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  total_bookings integer not null default 0,
  total_spent numeric(12, 2) not null default 0,
  outstanding_balance numeric(12, 2) not null default 0,
  blacklisted boolean not null default false,
  blacklist_reason text,
  blacklisted_at timestamptz,
  blacklisted_by uuid references staff(id) on delete set null,
  notes text,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table customers is 'Customer profiles. Minimal data: name + phone only (as per product spec).';
comment on column customers.outstanding_balance is 'Unpaid balance across all bookings';
comment on column customers.total_spent is 'Lifetime spend with this business';

alter table customers enable row level security;

create policy "superadmin_customers" on customers
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_customers" on customers
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create index idx_customers_business_id on customers(business_id);
create index idx_customers_phone on customers(phone);
create index idx_customers_name on customers(name);

-- ═══════════════════════════════════════════
-- TABLE 7: items
-- Inventory items
-- ═══════════════════════════════════════════
create table items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  sku text,
  cover_image_url text,
  daily_rate numeric(10, 2) not null default 0,
  deposit_amount numeric(10, 2) not null default 0,
  purchase_cost numeric(10, 2),
  purchase_date date,
  condition text not null default 'good'
    check (condition in ('excellent', 'good', 'fair', 'poor')),
  condition_notes text,
  storage_location text,
  status text not null default 'available'
    check (status in ('available', 'in_washing', 'maintenance', 'retired', 'paused')),
  is_active boolean not null default true,
  total_rentals integer not null default 0,
  total_revenue numeric(12, 2) not null default 0,
  last_rented_at timestamptz,
  completeness_score integer not null default 0 check (completeness_score between 0 and 100),
  metadata jsonb not null default '{}',
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table items is 'Inventory items. Each item can have multiple size variants.';
comment on column items.completeness_score is 'Auto-calculated 0-100 score based on filled fields and photos';
comment on column items.metadata is 'Additional flexible fields: colour, fabric, occasion tags, etc.';

alter table items enable row level security;

create policy "superadmin_items" on items
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_items" on items
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create policy "staff_update_items" on items
  for update using (
    branch_id in (select branch_id from staff where id = auth.uid() and status = 'active')
  );

create index idx_items_business_id on items(business_id);
create index idx_items_branch_id on items(branch_id);
create index idx_items_category on items(category);
create index idx_items_status on items(status);
create index idx_items_sku on items(sku);

-- ═══════════════════════════════════════════
-- TABLE 8: item_variants
-- Size variants for each item
-- ═══════════════════════════════════════════
create table item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  size text not null,
  colour text,
  sku text,
  total_stock integer not null default 1 check (total_stock >= 0),
  available_stock integer not null default 1 check (available_stock >= 0),
  reserved_stock integer not null default 0 check (reserved_stock >= 0),
  status text not null default 'available'
    check (status in ('available', 'unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_check check (available_stock + reserved_stock <= total_stock)
);

comment on table item_variants is 'Size variants for each item. e.g. Kurtha Set in S, M, L, XL with 2 units each.';
comment on column item_variants.reserved_stock is 'Stock locked by active bookings (confirmed/out status)';
comment on column item_variants.available_stock is 'Stock available for new bookings';

alter table item_variants enable row level security;

create policy "variants_via_items" on item_variants
  using (item_id in (
    select id from items where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

-- RPC function for atomic stock locking
create or replace function lock_item_stock(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
begin
  update item_variants
  set
    reserved_stock = reserved_stock + p_quantity,
    available_stock = available_stock - p_quantity,
    updated_at = now()
  where
    id = p_variant_id
    and available_stock >= p_quantity;

  if not found then
    raise exception 'Insufficient stock for variant %. Requested: %, Available: %',
      p_variant_id, p_quantity,
      (select available_stock from item_variants where id = p_variant_id)
    using errcode = 'P0001';
  end if;
end;
$$;

-- RPC function to release stock (on return or cancellation)
create or replace function release_item_stock(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
begin
  update item_variants
  set
    reserved_stock = greatest(0, reserved_stock - p_quantity),
    available_stock = available_stock + p_quantity,
    updated_at = now()
  where id = p_variant_id;

  if not found then
    raise exception 'Variant % not found', p_variant_id
    using errcode = 'P0002';
  end if;
end;
$$;

create index idx_item_variants_item_id on item_variants(item_id);

-- ═══════════════════════════════════════════
-- TABLE 9: item_images
-- Multiple photos per item
-- ═══════════════════════════════════════════
create table item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  url text not null,
  is_cover boolean not null default false,
  display_order integer not null default 0,
  uploaded_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table item_images enable row level security;

create policy "item_images_via_items" on item_images
  using (item_id in (
    select id from items where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

create index idx_item_images_item_id on item_images(item_id);
create index idx_item_images_is_cover on item_images(is_cover);

-- ═══════════════════════════════════════════
-- TABLE 10: bookings
-- Core booking records
-- ═══════════════════════════════════════════
create table bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  booking_number text unique not null,
  status text not null default 'pending'
    check (status in ('pending', 'booked', 'out', 'returned', 'closed', 'cancelled')),
  pickup_date date not null,
  return_date date not null,
  rental_days integer not null generated always as (
    greatest(return_date - pickup_date, 1)
  ) stored,
  subtotal numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  discount_reason text,
  tax_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  advance_amount numeric(12, 2) not null default 0,
  deposit_amount numeric(12, 2) not null default 0,
  balance_due numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  occasion text,
  booking_source text default 'walk_in'
    check (booking_source in ('walk_in', 'phone', 'whatsapp', 'referral', 'repeat')),
  notes text,
  staff_notes text,
  pickup_completed_at timestamptz,
  return_completed_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid references staff(id) on delete set null,
  last_updated_by uuid references staff(id) on delete set null,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_dates check (return_date >= pickup_date)
);

comment on table bookings is 'Core booking records. Status lifecycle: pending→booked→out→returned→closed';
comment on column bookings.booking_number is 'Human-readable ID e.g. TRT-260326-001';
comment on column bookings.rental_days is 'Auto-calculated from return_date - pickup_date, minimum 1';

alter table bookings enable row level security;

create policy "superadmin_bookings" on bookings
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_bookings" on bookings
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create index idx_bookings_business_id on bookings(business_id);
create index idx_bookings_branch_id on bookings(branch_id);
create index idx_bookings_customer_id on bookings(customer_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_pickup_date on bookings(pickup_date);
create index idx_bookings_return_date on bookings(return_date);
create index idx_bookings_created_at on bookings(created_at desc);
create index idx_bookings_number on bookings(booking_number);

-- Booking number generation function
create or replace function generate_booking_number(p_branch_id uuid, p_date date)
returns text
language plpgsql
security definer
as $$
declare
  v_prefix text;
  v_date_part text;
  v_sequence integer;
  v_number text;
begin
  select prefix into v_prefix from branches where id = p_branch_id;
  v_prefix := coalesce(v_prefix, 'BRN');
  v_date_part := to_char(p_date, 'DDMMYY');
  select count(*) + 1 into v_sequence
  from bookings
  where branch_id = p_branch_id
  and pickup_date = p_date;
  v_number := v_prefix || '-' || v_date_part || '-' || lpad(v_sequence::text, 3, '0');
  return v_number;
end;
$$;

-- ═══════════════════════════════════════════
-- TABLE 11: booking_items
-- Items in each booking
-- ═══════════════════════════════════════════
create table booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  item_variant_id uuid not null references item_variants(id) on delete restrict,
  item_name text not null,
  item_sku text,
  size text not null,
  quantity integer not null default 1 check (quantity > 0),
  daily_rate numeric(10, 2) not null,
  rental_days integer not null,
  subtotal numeric(12, 2) not null generated always as (
    daily_rate * quantity * rental_days
  ) stored,
  condition_on_return text
    check (condition_on_return in ('excellent', 'good', 'fair', 'poor', 'damaged', 'missing')),
  condition_notes_on_return text,
  created_at timestamptz not null default now()
);

comment on table booking_items is 'Line items in each booking. Item name/SKU stored to preserve history if item is deleted.';

alter table booking_items enable row level security;

create policy "booking_items_via_bookings" on booking_items
  using (booking_id in (
    select id from bookings where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

create index idx_booking_items_booking_id on booking_items(booking_id);
create index idx_booking_items_item_id on booking_items(item_id);

-- ═══════════════════════════════════════════
-- TABLE 12: booking_payments
-- Payment records for each booking
-- ═══════════════════════════════════════════
create table booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  type text not null
    check (type in ('advance', 'balance', 'deposit', 'deposit_refund', 'penalty', 'refund')),
  amount numeric(12, 2) not null check (amount > 0),
  method text not null
    check (method in ('cash', 'upi', 'bank_transfer', 'card', 'store_credit', 'online')),
  reference_number text,
  notes text,
  collected_by uuid references staff(id) on delete set null,
  is_voided boolean not null default false,
  voided_at timestamptz,
  voided_by uuid references staff(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now()
);

comment on table booking_payments is 'Individual payment transactions. Supports advance, balance, deposit, refund.';

alter table booking_payments enable row level security;

create policy "superadmin_payments" on booking_payments
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_payments" on booking_payments
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create index idx_booking_payments_booking_id on booking_payments(booking_id);
create index idx_booking_payments_business_id on booking_payments(business_id);
create index idx_booking_payments_type on booking_payments(type);
create index idx_booking_payments_method on booking_payments(method);
create index idx_booking_payments_created_at on booking_payments(created_at desc);

-- ═══════════════════════════════════════════
-- TABLE 13: booking_drafts
-- Auto-saved booking wizard state
-- ═══════════════════════════════════════════
create table booking_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  current_step integer not null default 1 check (current_step between 1 and 6),
  draft_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table booking_drafts enable row level security;

create policy "own_drafts" on booking_drafts
  using (staff_id = auth.uid());

create index idx_booking_drafts_staff_id on booking_drafts(staff_id);

-- ═══════════════════════════════════════════
-- TABLE 14: booking_timeline
-- Audit trail for every booking event
-- ═══════════════════════════════════════════
create table booking_timeline (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  event_type text not null,
  event_description text not null,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid references staff(id) on delete set null,
  performed_by_name text,
  created_at timestamptz not null default now()
);

alter table booking_timeline enable row level security;

create policy "business_staff_timeline" on booking_timeline
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create index idx_booking_timeline_booking_id on booking_timeline(booking_id);

-- ═══════════════════════════════════════════
-- TABLE 15: washing_queue
-- Washing/cleaning tracking
-- ═══════════════════════════════════════════
create table washing_queue (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  item_variant_id uuid references item_variants(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  stage text not null default 'in_washing'
    check (stage in ('in_washing', 'ready')),
  priority text not null default 'normal'
    check (priority in ('urgent', 'normal', 'low')),
  notes text,
  added_by uuid references staff(id) on delete set null,
  completed_by uuid references staff(id) on delete set null,
  completed_at timestamptz,
  next_booking_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table washing_queue is 'Two-stage washing: in_washing → ready. After ready, item status becomes available.';
comment on column washing_queue.priority is 'urgent=next booking < 48h, normal=default, low=no upcoming booking';

alter table washing_queue enable row level security;

create policy "superadmin_washing" on washing_queue
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_washing" on washing_queue
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create index idx_washing_queue_business_id on washing_queue(business_id);
create index idx_washing_queue_branch_id on washing_queue(branch_id);
create index idx_washing_queue_stage on washing_queue(stage);
create index idx_washing_queue_item_id on washing_queue(item_id);

-- ═══════════════════════════════════════════
-- TABLE 16: notifications
-- In-app notifications
-- ═══════════════════════════════════════════
create table notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  target_staff_id uuid references staff(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  action_url text,
  action_type text,
  action_data jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "own_notifications" on notifications
  for select using (
    target_staff_id = auth.uid()
    or (
      target_staff_id is null
      and branch_id in (select branch_id from staff where id = auth.uid() and status = 'active')
    )
  );

create policy "insert_notifications" on notifications
  for insert with check (true);

create policy "update_own_notifications" on notifications
  for update using (target_staff_id = auth.uid());

create index idx_notifications_target_staff on notifications(target_staff_id);
create index idx_notifications_business_id on notifications(business_id);
create index idx_notifications_is_read on notifications(is_read);
create index idx_notifications_created_at on notifications(created_at desc);

-- ═══════════════════════════════════════════
-- TABLE 17: audit_log
-- System-wide audit trail
-- ═══════════════════════════════════════════
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  staff_name text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

comment on table audit_log is 'Immutable audit trail. Never update or delete rows. Insert only.';

alter table audit_log enable row level security;

create policy "superadmin_audit_log" on audit_log
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "owner_manager_audit_read" on audit_log
  for select using (
    business_id in (
      select business_id from staff where id = auth.uid()
      and role in ('owner', 'manager') and status = 'active'
    )
  );

create policy "insert_audit_log" on audit_log
  for insert with check (true);

create index idx_audit_log_business_id on audit_log(business_id);
create index idx_audit_log_entity on audit_log(entity_type, entity_id);
create index idx_audit_log_created_at on audit_log(created_at desc);

-- ═══════════════════════════════════════════
-- TABLE 18: sms_log
-- Record of all SMS sent
-- ═══════════════════════════════════════════
create table sms_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  phone text not null,
  message text,
  template_id text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'delivered')),
  provider_response jsonb,
  sent_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table sms_log enable row level security;

create policy "business_staff_sms_log" on sms_log
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create index idx_sms_log_business_id on sms_log(business_id);
create index idx_sms_log_booking_id on sms_log(booking_id);

-- ═══════════════════════════════════════════
-- TABLE 19: expenses
-- Business expenses tracking
-- ═══════════════════════════════════════════
create table expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  category text not null
    check (category in ('rent', 'salary', 'utilities', 'maintenance', 'washing', 'transport', 'marketing', 'other')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  expense_date date not null,
  receipt_url text,
  added_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

create policy "owner_manager_expenses" on expenses
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

create index idx_expenses_business_id on expenses(business_id);
create index idx_expenses_date on expenses(expense_date desc);

-- ═══════════════════════════════════════════
-- TABLE 20: staff_attendance
-- GPS clock-in/out records
-- ═══════════════════════════════════════════
create table staff_attendance (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  clock_in_lat numeric(10, 7),
  clock_in_lng numeric(10, 7),
  distance_from_branch numeric(8, 2),
  is_valid_location boolean,
  hours_worked numeric(5, 2),
  notes text,
  approved_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(staff_id, date)
);

alter table staff_attendance enable row level security;

create policy "own_attendance" on staff_attendance
  for select using (staff_id = auth.uid());

create policy "manager_owner_attendance" on staff_attendance
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

create index idx_attendance_staff_id on staff_attendance(staff_id);
create index idx_attendance_date on staff_attendance(date desc);

-- ═══════════════════════════════════════════
-- TABLE 21: staff_performance_targets
-- Monthly targets for staff
-- ═══════════════════════════════════════════
create table staff_performance_targets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  month date not null,
  revenue_target numeric(12, 2),
  bookings_target integer,
  set_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(staff_id, month)
);

alter table staff_performance_targets enable row level security;

create policy "own_targets" on staff_performance_targets
  for select using (staff_id = auth.uid());

create policy "manager_set_targets" on staff_performance_targets
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

-- ═══════════════════════════════════════════
-- pg_cron JOBS
-- ═══════════════════════════════════════════

-- Job 1: Mark overdue bookings at midnight IST (18:30 UTC)
select cron.schedule(
  'fabb-overdue-check',
  '30 18 * * *',
  $$
  update bookings
  set status = 'out', updated_at = now()
  where status = 'booked'
  and return_date < current_date;

  insert into notifications (business_id, branch_id, type, title, body, action_url, created_at)
  select
    b.business_id,
    b.branch_id,
    'overdue_booking',
    'Booking Overdue: ' || b.booking_number,
    c.name || '''s items were due yesterday. Please follow up.',
    '/bookings/' || b.id,
    now()
  from bookings b
  left join customers c on b.customer_id = c.id
  where b.status = 'out'
  and b.return_date < current_date;
  $$
);

-- Job 2: Clean up expired booking drafts (older than 7 days)
select cron.schedule(
  'fabb-cleanup-drafts',
  '0 19 * * *',
  $$
  delete from booking_drafts
  where updated_at < now() - interval '7 days';
  $$
);


# ══════════════════════════════════════════════════════════════════════
# PART 8: AUTHENTICATION MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 8.1 Auth Module Overview

The authentication module is the entry point for all users of Fabb.booking.
It handles three distinct scenarios:
  1. Business owners registering for the first time
  2. Staff members logging in with credentials created by Super Admin
  3. Super Admin (Ansil) accessing the admin panel

Key design decision: NO approval gate for registered staff.
Any staff member whose email exists in the staff table with status='active'
gets immediate dashboard access upon successful login.
This is intentional — it mirrors how Booqable works (no pending approval workflow).

## 8.2 Files Structure

app/
├── (auth)/
│   ├── layout.tsx                    ← Auth layout (no sidebar, centered card)
│   ├── login/
│   │   ├── page.tsx                  ← Login page
│   │   └── components/
│   │       ├── LoginForm.tsx         ← Email+password form
│   │       ├── GoogleButton.tsx      ← Google OAuth button
│   │       └── ForgotPasswordModal.tsx
│   ├── signup/
│   │   └── page.tsx                  ← Business signup page
│   ├── setup/
│   │   └── page.tsx                  ← 5-step setup wizard
│   ├── suspended/
│   │   └── page.tsx                  ← Suspended account screen
│   └── reset-password/
│       └── page.tsx                  ← Password reset screen
├── auth/
│   └── callback/
│       └── route.ts                  ← Google OAuth callback
└── api/
    └── auth/
        ├── login/
        │   └── route.ts              ← Email login API route
        ├── signup/
        │   └── route.ts              ← Business signup API route
        ├── forgot-password/
        │   └── route.ts              ← Send reset email
        └── reset-password/
            └── route.ts              ← Apply new password

## 8.3 Auth Layout (app/(auth)/layout.tsx)

The auth layout wraps all authentication pages.
It provides:
  - Full-screen centered layout (no sidebar, no header)
  - Fabb.booking logo at top center
  - White card container max-w-md
  - Background: slate-50 with subtle pattern

```typescript
// app/(auth)/layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 ${inter.className}`}>
      <div className="mb-8">
        <img src="/logo.svg" alt="Fabb.booking" className="h-8" />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-8 text-sm text-slate-400">
        © 2026 Fabb.booking. All rights reserved.
      </p>
    </div>
  )
}
```

## 8.4 LOGIN PAGE — Complete Specification

Route: fabb.com/login
File: app/(auth)/login/page.tsx

### 8.4.1 Visual Layout

The login page is a shadcn/ui Card component centered on the page.

Card structure:
  CardHeader:
    Title: "Welcome back" (text-2xl font-semibold)
    Description: "Sign in to your Fabb.booking account"

  CardContent:
    Section 1: Google OAuth button (full width)
    Divider: "or continue with email" (relative text-sm, line on each side)
    Section 2: Email + password form
    Forgot password link (right-aligned, text-sm)

  CardFooter:
    "Don't have an account? Register your business →" (center)

### 8.4.2 Google OAuth Button

```tsx
// components/auth/GoogleButton.tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function GoogleButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full h-10"
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          {/* Google SVG icon */}
        </svg>
      )}
      Continue with Google
    </Button>
  )
}
```

### 8.4.3 Email Login Form

Fields:
  Email address:
    shadcn Input, type=email
    Placeholder: "name@company.com"
    Validation: valid email format (Zod)
    Auto-focus on page load

  Password:
    shadcn Input, type=password with toggle
    Right side: Eye/EyeOff icon button to show/hide
    Placeholder: "Enter your password"
    Validation: min 1 character (no complexity check on login)

  Remember me:
    shadcn Checkbox (left) + "Remember me for 30 days" (right)
    Default: unchecked
    When checked: session persists 30 days

  Forgot password:
    Text button, right-aligned
    Click: opens ForgotPasswordModal (shadcn Dialog)

  Submit button:
    "Sign in" (full width, default variant = blue)
    Loading state: Loader2 spin + "Signing in..."
    Disabled during submit

### 8.4.4 Email Login API Route

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // Step 1: Rate limiting check
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count: failCount } = await supabaseAdmin
    .from('login_attempts')
    .select('*', { count: 'exact' })
    .eq('email', email.toLowerCase())
    .eq('success', false)
    .gte('attempted_at', fifteenMinutesAgo)

  if ((failCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  // Step 2: Find staff by email
  const { data: staffRecord } = await supabaseAdmin
    .from('staff')
    .select('id, email, password_hash, status, role, setup_completed, business_id, branch_id, name')
    .eq('email', email.toLowerCase())
    .single()

  const logAttempt = async (success: boolean) => {
    await supabaseAdmin.from('login_attempts').insert({
      email: email.toLowerCase(), ip_address: ip, success
    })
  }

  // Step 3: Validate email exists
  if (!staffRecord || !staffRecord.password_hash) {
    await logAttempt(false)
    const remaining = 5 - ((failCount ?? 0) + 1)
    return NextResponse.json(
      {
        error: remaining > 0
          ? `No account found with this email. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'No account found with this email.',
        code: 'INVALID_CREDENTIALS'
      },
      { status: 401 }
    )
  }

  // Step 4: Check account status
  if (staffRecord.status === 'suspended') {
    return NextResponse.json(
      { error: 'Your account has been suspended. Contact your administrator.', code: 'SUSPENDED' },
      { status: 403 }
    )
  }

  // Step 5: Verify password
  const passwordValid = await bcrypt.compare(password, staffRecord.password_hash)
  if (!passwordValid) {
    await logAttempt(false)
    const remaining = 5 - ((failCount ?? 0) + 1)
    return NextResponse.json(
      {
        error: remaining > 0
          ? `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Incorrect password. Account temporarily locked.',
        code: 'INVALID_CREDENTIALS'
      },
      { status: 401 }
    )
  }

  // Step 6: Success — create session
  await logAttempt(true)
  await supabaseAdmin
    .from('staff')
    .update({ last_login: new Date().toISOString(), failed_login_attempts: 0 })
    .eq('id', staffRecord.id)

  const { data: { session }, error: sessionError } = await supabaseAdmin.auth.admin.createSession(staffRecord.id)
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session', code: 'SESSION_ERROR' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    session,
    staff: {
      id: staffRecord.id,
      name: staffRecord.name,
      role: staffRecord.role,
      setup_completed: staffRecord.setup_completed,
      business_id: staffRecord.business_id,
      branch_id: staffRecord.branch_id
    }
  })
}
```

### 8.4.5 Error Messages Specification

All error messages shown below the form in a shadcn Alert component:

INVALID_CREDENTIALS (wrong password):
  variant: destructive
  Icon: AlertCircle
  Text: "Incorrect password. X attempts remaining before lockout."

INVALID_CREDENTIALS (email not found):
  variant: destructive
  Icon: AlertCircle
  Text: "No account found with this email. Contact your business admin."

RATE_LIMITED:
  variant: destructive
  Icon: Clock
  Text: "Too many failed attempts. Your account is locked for 15 minutes."
  Additional: countdown timer showing minutes remaining

SUSPENDED:
  variant: destructive
  Icon: Ban
  Text: "Your account has been suspended. Contact [business name] admin."
  Button: "Contact Support" (opens WhatsApp to Ansil)

GOOGLE_NOT_FOUND:
  variant: destructive
  Icon: AlertCircle
  Text: "No Fabb.booking account found for this Google account. Contact your admin."

### 8.4.6 Forgot Password Modal

Triggered by: "Forgot password?" link
Component: shadcn Dialog (max-w-sm)

States:

State 1 — Email input:
  Title: "Reset your password"
  Description: "Enter your email. We'll send a reset link."
  Email input field (pre-filled from login form)
  "Send reset link" button (blue, full width)
  "Cancel" link button

State 2 — Email sent:
  Green CheckCircle icon (large, centered)
  Title: "Check your email"
  Text: "We sent a reset link to {email}"
  Subtext: "Check your spam folder if not received."
  "Resend link" button (outline, disabled for 60 seconds with countdown)
  "Back to login" link

State 3 — Email not found:
  Red X icon
  Title: "Email not found"
  Text: "No account found for {email}. Contact your business admin to create your account."
  "Try a different email" link

### 8.4.7 Reset Password Page

Route: fabb.com/reset-password?token={uuid}

Validation:
  Check password_reset_tokens table:
    token must exist
    expires_at must be > now()
    used_at must be null

  If invalid/expired:
    Show error card: "This link has expired or is invalid."
    Button: "Request new reset link" → back to login → opens forgot password modal

Form fields:
  New password:
    shadcn Input type=password with show/hide toggle
    Password strength indicator (4-segment bar):
      Red: < 6 characters
      Orange: 6+ characters
      Yellow: 8+ chars with number
      Green: 8+ chars with number AND uppercase (required)
    Requirements shown: "Min 8 characters, 1 uppercase, 1 number"

  Confirm password:
    shadcn Input type=password with toggle
    Real-time match check: "Passwords do not match" shown in red

  Submit: "Set new password" (blue, full width)

On success:
  Update staff.password_hash with new bcrypt hash (12 rounds)
  Mark token as used: password_reset_tokens.used_at = now()
  Log to audit_log: { action: 'PASSWORD_RESET', entity_type: 'staff' }
  Show success toast: "Password updated successfully"
  Auto-redirect to /login after 3 seconds

## 8.5 BUSINESS SIGNUP PAGE

Route: fabb.com/signup
File: app/(auth)/signup/page.tsx

### 8.5.1 Purpose

This page is for NEW businesses registering for Fabb.booking.
Staff members do NOT use this page — they receive credentials from Super Admin.

### 8.5.2 Visual Layout

shadcn Card, max-w-md, with:
  CardHeader:
    Fabb.booking logo (32px)
    Title: "Start your free trial"
    Description: "Set up your rental business in 2 minutes. No credit card required."

  CardContent:
    Signup form (5 fields)

  CardFooter:
    "Already have an account? Sign in →"

### 8.5.3 Signup Form Fields

ALL fields use shadcn Form + FormField + FormControl + FormLabel + FormMessage

Field 1 — Business Name:
  Label: "Business name"
  Placeholder: "e.g. Raj Bridal Collections"
  Validation: min 2 chars, max 100 chars
  Helper: Will become your account name on Fabb.booking

Field 2 — Your Name:
  Label: "Your name"
  Placeholder: "e.g. Rajesh Kumar"
  Validation: min 2 chars, max 100 chars

Field 3 — Email Address:
  Label: "Work email"
  Placeholder: "you@yourbusiness.com"
  Validation: valid email format
  Note: This becomes your login email

Field 4 — Phone Number:
  Label: "WhatsApp number"
  Input: prefix "+91" (fixed, non-editable) + 10-digit input
  Placeholder: "98765 43210"
  Validation: /^[6-9]\d{9}$/ (Indian mobile number)
  Note: For account support and SMS

Field 5 — City:
  Label: "City"
  Placeholder: "e.g. Thrissur"
  Validation: min 2 chars, max 100 chars

Submit Button:
  "Create free account →" (blue, full width, h-10)
  Loading: "Creating your account..." with spinner
  Disabled during submission

Terms text (below button):
  "By signing up, you agree to our Terms of Service and Privacy Policy."
  (text-xs text-slate-400)

### 8.5.4 Signup API Route

```typescript
// app/api/auth/signup/route.ts
export async function POST(req: NextRequest) {
  const { businessName, ownerName, email, phone, city } = await req.json()

  // Step 1: Validate inputs
  const schema = z.object({
    businessName: z.string().min(2).max(100),
    ownerName: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
    city: z.string().min(2).max(100)
  })
  const validated = schema.safeParse({ businessName, ownerName, email, phone, city })
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 })
  }

  // Step 2: Check duplicate email
  const { data: existingStaff } = await supabaseAdmin
    .from('staff').select('id').eq('email', email.toLowerCase()).single()
  if (existingStaff) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Sign in instead.', code: 'DUPLICATE_EMAIL' },
      { status: 400 }
    )
  }

  // Step 3: Generate slug for business
  const baseSlug = businessName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  let slug = baseSlug
  let slugSuffix = 1
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from('businesses').select('id').eq('slug', slug).single()
    if (!existing) break
    slug = `${baseSlug}-${slugSuffix++}`
  }

  // Step 4: Create business
  const { data: business, error: bizError } = await supabaseAdmin
    .from('businesses')
    .insert({
      name: businessName,
      slug,
      email: email.toLowerCase(),
      phone,
      city,
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select().single()
  if (bizError || !business) throw new Error('Failed to create business')

  // Step 5: Create default branch
  const { data: branch } = await supabaseAdmin
    .from('branches')
    .insert({
      business_id: business.id,
      name: businessName,
      city,
      prefix: businessName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X'),
      is_default: true,
      settings: {
        booking_rules: {
          min_advance_pct: 30,
          buffer_days: 1,
          max_advance_days: 180,
          deposit_default_pct: 20
        },
        invoice: {
          prefix: 'INV',
          next_number: 1,
          show_gst: false,
          footer_text: 'Thank you for choosing ' + businessName
        },
        sms: { enabled: false, api_key: '', sender_id: '' }
      }
    })
    .select().single()

  // Step 6: Create Supabase auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.toLowerCase(),
    email_confirm: true,
    user_metadata: { name: ownerName, business_id: business.id }
  })
  if (authError || !authUser.user) throw new Error('Failed to create auth user')

  // Step 7: Hash a temporary password (owner sets their own in setup wizard)
  const tempPassword = crypto.randomUUID().slice(0, 12)
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  // Step 8: Create owner staff record
  await supabaseAdmin.from('staff').insert({
    id: authUser.user.id,
    business_id: business.id,
    branch_id: branch!.id,
    email: email.toLowerCase(),
    name: ownerName,
    phone,
    role: 'owner',
    status: 'active',
    password_hash: passwordHash,
    setup_completed: false
  })

  // Step 9: Update business with owner_id
  await supabaseAdmin.from('businesses').update({ owner_id: authUser.user.id }).eq('id', business.id)

  // Step 10: Send welcome email via Edge Function (fire and forget)
  supabaseAdmin.functions.invoke('send-email', {
    body: {
      type: 'welcome',
      to: email,
      name: ownerName,
      businessName,
      loginUrl: 'https://fabb.com/login',
      tempPassword
    }
  }).catch(console.error)

  // Step 11: Create Supabase session for immediate login
  const { data: { session } } = await supabaseAdmin.auth.admin.createSession(authUser.user.id)

  return NextResponse.json({
    success: true,
    session,
    businessId: business.id,
    branchId: branch!.id,
    redirect: '/setup'
  })
}
```

### 8.5.5 After Signup

After the API returns success:
  1. Store session from API response in cookies
  2. Show toast: "Account created! Setting up your workspace..."
  3. Redirect to /setup (5-step setup wizard)
  4. Staff (and future auth) uses the email+password from setup wizard
     (owner sets their real password in setup wizard Step 1)

## 8.6 SETUP WIZARD — 5 Steps

Route: fabb.com/setup
File: app/(auth)/setup/page.tsx
Only shown when staff.setup_completed = false

### 8.6.1 Wizard Layout

Full-page layout with:
  Top: Fabb.booking logo + "Setup" breadcrumb
  Progress bar: thin #2563eb line filling based on current step (20% per step)
  Step indicator: 5 circles with numbers + labels below
  Content area: card showing current step form
  Navigation: Back button (ghost) + Next/Finish button (blue)

Step labels: Business | Branch | Staff | Inventory | Go Live

### 8.6.2 Step 1 — Business Details

Fields to complete business profile:
  Business name: pre-filled from signup (editable)
  Business logo: react-dropzone upload → compress → store in images bucket
  Phone: pre-filled from signup
  Email: pre-filled from signup
  Address: textarea
  City, State, Pincode: three inputs in a row
  GST Number: optional (format validation: 15 chars)
  Set your password: owner sets their actual password here
    Password input with strength meter
    Confirm password input

On Next: update businesses record + update staff.password_hash

### 8.6.3 Step 2 — Branch Setup

Title: "Tell us about your store location"
Description: This becomes your main branch in Fabb.booking.

Fields:
  Branch name: e.g. "Main Store - Thrissur" (pre-filled with business name)
  Full address: textarea
  City: auto-filled from Step 1
  Phone: auto-filled from Step 1
  Booking ID prefix: 3-letter code (e.g. TRT for Thrissur)
    Auto-suggested from city name (first 3 letters)
    User can change
    Validation: exactly 3 uppercase letters
    Preview: "Your booking IDs will look like: TRT-260326-001"

On Next: update branches record

### 8.6.4 Step 3 — Add Your Team

Title: "Who works with you?"
Description: "Add your staff. They'll receive login credentials."

Interface:
  Table showing staff to add
  Each row: Name input + Role selector (Manager/Staff) + Remove button
  "+ Add staff member" button adds a row
  Minimum: 0 staff (owner can skip)
  Maximum: 10 staff in setup wizard

For each staff member added:
  Generate temporary password
  Create staff record (status=active)
  Schedule welcome email (sent after wizard completion)

"Skip for now" link (small, below table)
Note: "Staff can be added later from Settings → Staff"

### 8.6.5 Step 4 — Add Inventory

Title: "Add some items to get started"
Description: "Add a few items from your collection. You can add more later."

Quick add interface:
  Repeating form rows with:
    Item name (Input)
    Category (shadcn Select: Kurtha / Suits / Loafers / Shoes / Cap / Accessories)
    Size variant (comma-separated, e.g. "S, M, L, XL")
    Stock per size (number)
    Daily rate ₹ (number)
    "+ Add item" button

Minimum: 0 items (can skip)
"Skip for now" link

On Next: insert items + item_variants for each added item

### 8.6.6 Step 5 — All Set!

Title: "You're ready to go! 🎉"
Description: "Your Fabb.booking workspace is set up."

Summary card showing:
  ✅ Business profile complete
  ✅ Main branch configured: {branchName}
  ✅ {staffCount} team members added
  ✅ {itemCount} items added

Trial info:
  "Your 14-day free trial started today."
  "Trial ends: {date}"
  "No credit card required. Cancel anytime."

CTA button: "Go to Dashboard →" (blue, large, full width)

On click:
  update staff.setup_completed = true
  Log to audit_log: { action: 'SETUP_COMPLETED' }
  Navigate to /dashboard

## 8.7 MIDDLEWARE — Complete Route Protection

File: middleware.ts (project root)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = [
  '/login', '/signup', '/reset-password',
  '/auth/callback', '/', '/pricing', '/suspended',
  '/api/auth/login', '/api/auth/signup',
  '/api/auth/forgot-password', '/api/auth/reset-password'
]

const ROLE_PROTECTED_PATHS: Record<string, string[]> = {
  '/analytics': ['owner', 'manager', 'super_admin'],
  '/staff': ['owner', 'manager', 'super_admin'],
  '/expenses': ['owner', 'manager', 'super_admin'],
  '/admin': ['super_admin'],
  '/settings/staff': ['owner', 'manager', 'super_admin'],
  '/settings/billing': ['owner', 'super_admin']
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set(name, value, options),
        remove: (name, options) => res.cookies.delete(name)
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = req.nextUrl.pathname

  // Allow public paths
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    // If logged in user visits login/signup → redirect to dashboard
    if (user && (path === '/login' || path === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Get staff record
  const { data: staff } = await supabase
    .from('staff')
    .select('role, status, setup_completed, business_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!staff) return NextResponse.redirect(new URL('/login', req.url))

  // Suspended account
  if (staff.status === 'suspended') {
    return NextResponse.redirect(new URL('/suspended', req.url))
  }

  // Setup not completed (owner first login)
  if (!staff.setup_completed && staff.role === 'owner' && !path.startsWith('/setup')) {
    return NextResponse.redirect(new URL('/setup', req.url))
  }

  // Role-based path protection
  for (const [protectedPath, allowedRoles] of Object.entries(ROLE_PROTECTED_PATHS)) {
    if (path.startsWith(protectedPath) && !allowedRoles.includes(staff.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|sounds|images).*)']
}
```

## 8.8 SUSPENDED ACCOUNT PAGE

Route: fabb.com/suspended
File: app/(auth)/suspended/page.tsx

Design:
  Centered card, max-w-md
  Large red Ban icon (lucide, 64px)
  Title: "Account Suspended" (text-xl font-semibold text-red-600)
  Body: "Your account has been suspended by your business administrator."
  Subtext: "If you believe this is a mistake, contact your admin."

Actions:
  "Contact Admin on WhatsApp" button (outline):
    Opens wa.me link to business owner's phone
  "Sign Out" button (ghost, small):
    supabase.auth.signOut() → redirect to /login


# ══════════════════════════════════════════════════════════════════════
# PART 9: DASHBOARD MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 9.1 Dashboard Overview

The dashboard is the home screen of Fabb.booking. It shows a daily operational
summary of the business — what's happening today, what needs attention, and
key business metrics. It is designed to be scannable in under 10 seconds.

Reference: Booqable's dashboard is clean and data-dense. Fabb.booking matches
this aesthetic — no decorative elements, all content is actionable.

Dashboard is role-aware:
  staff → sees today's pickups, returns, and their own bookings
  manager → sees all of the above plus revenue, overdue count, washing alerts
  owner → same as manager plus financial metrics
  super_admin → cross-business aggregate view

## 9.2 Files Structure

app/
└── (dashboard)/
    ├── layout.tsx                ← Dashboard layout (sidebar + header)
    ├── page.tsx                  ← Dashboard home
    └── components/
        ├── Sidebar.tsx
        ├── Header.tsx
        ├── StatCards.tsx
        ├── TodaySchedule.tsx
        ├── OverdueAlert.tsx
        ├── WashingAlert.tsx
        ├── RevenueChart.tsx
        └── QuickActions.tsx

## 9.3 Dashboard Layout (app/(dashboard)/layout.tsx)

The dashboard layout wraps all authenticated app pages and provides:
  - Fixed sidebar (240px expanded, 64px collapsed on desktop)
  - Fixed top header (56px height)
  - Scrollable content area with proper spacing
  - Notification channel subscription
  - PIN lock screen overlay

```typescript
// app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: staff } = await supabase.from('staff')
    .select('*, business:businesses(*), branch:branches(*)')
    .eq('id', user!.id).single()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar staff={staff} />
      <div className="ml-60 flex flex-col min-h-screen transition-all duration-300">
        <Header staff={staff} />
        <main className="flex-1 p-6 mt-14">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## 9.4 SIDEBAR — Complete Specification

File: app/(dashboard)/components/Sidebar.tsx

### 9.4.1 Sidebar Structure

```
┌──────────────────────────────┐
│  [Logo] Fabb.booking          │  ← Header section
│  Business Name               │
│  Branch Name ▾               │  ← Branch switcher (if multi-branch)
├──────────────────────────────┤
│  ⊞ Dashboard                 │  ← Navigation section
│  📅 Bookings        [3]      │  ← Badge: active bookings
│  📦 Inventory               │
│  👤 Customers                │
│  💳 Payments                 │
│  📊 Analytics        ←owner│  ← Hidden for staff role
│  🧺 Washing          [2]    │  ← Badge: in_washing count
│  👥 Staff            ←mgr  │
│  💰 Expenses         ←mgr  │
├──────────────────────────────┤
│  ⚙️ Settings                 │
│  🔔 Notifications   [5]     │  ← Badge: unread count
├──────────────────────────────┤
│  [Avatar] John Manager       │  ← User section
│  Floor Staff                 │
└──────────────────────────────┘
```

### 9.4.2 Sidebar Brand Section

Fabb.booking logo (SVG, 24px height) + "Fabb.booking" text
In collapsed mode: logo only (centered)

Business name below logo: from businesses.name
Branch indicator (if staff has single branch): branch name small
Branch switcher (if manager+ with multiple branches):
  Current branch name + ChevronDown icon
  Click: shadcn Popover with list of all branches in this business
  Selecting branch: updates activeBranchId in Zustand + refetches all data

### 9.4.3 Navigation Items

Each nav item:
  Icon (lucide, 20px) + Label (text-sm font-medium) + optional badge

Active state:
  Light: bg-blue-50 text-blue-700 font-semibold
  Dark: bg-blue-950 text-blue-300 font-semibold
  Left border: 3px solid #2563eb

Hover state:
  Light: bg-slate-100 text-slate-900
  Dark: bg-slate-700 text-slate-100

Collapsed state:
  Icon only (centered)
  shadcn Tooltip shows label on hover

Navigation items in order:
  1. Dashboard (LayoutDashboard) — all roles
  2. Bookings (CalendarCheck) — all roles
     Badge: count of (booked + out) bookings
  3. Inventory (Package) — all roles
  4. Customers (Users) — all roles
  5. Payments (CreditCard) — all roles
  6. Analytics (BarChart3) — owner + manager only
  7. Washing Queue (Waves) — all roles
     Badge: count of in_washing items
  8. Staff (UserCheck) — owner + manager only
  9. Expenses (Receipt) — owner + manager only
  ---separator---
  10. Settings (Settings) — all roles
  11. Notifications (Bell) — all roles
      Badge: count of unread notifications

### 9.4.4 Sidebar Bottom — User Profile

Staff avatar (shadcn Avatar):
  AvatarImage: profile_photo_url if set
  AvatarFallback: initials from name (e.g. "JM" for "John Manager")
  Size: 32px (w-8 h-8)

Staff name (text-sm font-medium, truncated)
Role badge (shadcn Badge variant=secondary, text-xs): Staff / Manager / Owner

3-dot menu (shadcn DropdownMenu) on hover/click:
  My Profile → /settings/profile
  Change Password → modal
  Appearance (dark/light toggle)
  ---separator---
  Sign Out (text-red-600) → supabase.auth.signOut() → /login

### 9.4.5 Collapse/Expand

Desktop: Collapse button at bottom of sidebar
  ChevronLeft (expanded) / ChevronRight (collapsed)
  Width transitions from 240px to 64px over 300ms (CSS transition)
  State saved to localStorage: 'fabb-sidebar-collapsed'

Mobile: Sidebar hidden by default
  Hamburger button in header (☰)
  Opens as full-width overlay drawer
  Backdrop overlay closes on click

## 9.5 HEADER — Complete Specification

File: app/(dashboard)/components/Header.tsx

### 9.5.1 Header Layout

Left side: Page title (h1, text-lg font-semibold)
  Dynamically set via Zustand uiStore.pageTitle
  Each page sets this in useEffect on mount

Right side (flex gap-2):
  Global search button (Search icon + "Search..." placeholder button)
  Notification bell (with unread badge)
  Dark/light mode toggle
  User avatar (dropdown)

### 9.5.2 Global Search

Trigger: Click search button OR keyboard shortcut Cmd+K / Ctrl+K
Opens: Full-page search overlay (shadcn Command component)

Search overlay:
  Input: "Search bookings, items, customers..."
  Results grouped by type:
    Bookings: booking_number + customer name + status badge
    Items: item name + category + status badge
    Customers: name + phone

Click result: navigates to detail page + closes search

Keyboard navigation:
  Arrow Up/Down: move between results
  Enter: navigate to selected result
  Escape: close search

API: Supabase full-text search across bookings, items, customers tables
  Uses: to_tsvector for indexing, to_tsquery for search
  Filter: always scoped to current business_id

### 9.5.3 Notification Bell

Badge: red circle with unread count (max "99+")
Click: opens shadcn Sheet from right (400px width)

Sheet contents:
  Header: "Notifications" title + "Mark all read" button
  Filter tabs: All | Unread | Bookings | Washing | Staff
  Notification list (infinite scroll)

Each notification:
  Icon circle (colored by type)
  Title (text-sm font-medium)
  Body (text-xs text-slate-500, line-clamp-2)
  Time ago (text-xs text-slate-400)
  Unread indicator: blue left border + slightly lighter bg

Notification types and icons:
  overdue_booking: AlertTriangle (red) — "Booking {ID} is overdue"
  washing_ready: CheckCircle (green) — "{Item} is ready from washing"
  booking_created: CalendarPlus (blue) — "New booking {ID} created"
  payment_received: Coins (green) — "₹{amount} received for booking {ID}"
  low_stock: Package (amber) — "{Item} stock is low"

On click notification: mark as read + navigate to action_url

Realtime: New notifications appear instantly at top of list via Supabase Realtime

### 9.5.4 Dark/Light Mode Toggle

Button: Sun icon (dark mode) / Moon icon (light mode)
Toggle: useTheme() from next-themes
Theme saved to localStorage

## 9.6 DASHBOARD PAGE — Complete Specification

File: app/(dashboard)/page.tsx

### 9.6.1 Page Structure

```
Page Title: "Dashboard"
Date display: "Thursday, 26 March 2026" (right-aligned)

Section 1: Quick Actions Row
Section 2: Stat Cards (4 cards)
Section 3: Today's Schedule (split: Pickups | Returns)
Section 4: Alerts Row (Overdue | Washing | Low Stock)
Section 5: Revenue Chart (manager/owner only)
```

### 9.6.2 Quick Actions Row

4 large action buttons in a horizontal row (2×2 on mobile)

Button 1: "+ New Booking"
  bg-blue-600 text-white (primary style)
  Icon: Plus (20px)
  Click: navigate to /bookings/new
  This is the most important action — most prominent

Button 2: "Scan QR"
  bg-white border border-slate-200 (outline style)
  Icon: QrCode (20px)
  Click: opens QR scanner modal (html5-qrcode)
  On scan: navigates to booking or item based on QR content

Button 3: "Mark Return"
  bg-white border (outline)
  Icon: Undo2 (20px)
  Click: opens search modal to find booking for return

Button 4: "Washing Queue"
  bg-white border (outline)
  Icon: Droplets (20px)
  Click: navigate to /washing

### 9.6.3 Stat Cards — Complete Specification

4 stat cards in a 2×2 grid (desktop: 4-column, mobile: 2-column)

All stat cards use shadcn Card with:
  CardContent: p-6
  Layout: icon (left, colored circle bg) + value + label
  Loading: shadcn Skeleton placeholder

CARD 1 — Revenue Today:
  Icon: IndianRupee (blue circle bg)
  Value: formatINR(todayRevenue) — e.g. "₹24,500"
  Label: "Revenue today"
  Sub-text: "₹X this week | ₹Y this month"
  Data: SUM(booking_payments.amount) WHERE created_at::date = today
        AND business_id = current AND is_voided = false
  Shown to: manager, owner, super_admin only
  Floor staff: sees "X bookings created today" instead

CARD 2 — Total Bookings:
  Icon: CalendarCheck (violet circle bg)
  Value: count of all active bookings (booked + out status)
  Label: "Active bookings"
  Sub-text: "X booked | Y out | Z overdue"
  Data: COUNT(bookings) WHERE status IN ('booked','out') AND business_id = current
  Shown to: all roles

CARD 3 — Items Out:
  Icon: Package (amber circle bg)
  Value: count of items currently out (status='out')
  Label: "Items on rent"
  Sub-text: "of X total items"
  Data: COUNT(bookings) WHERE status='out' + SUM(booking_items.quantity)
  Shown to: all roles

CARD 4 — Overdue Returns:
  Icon: AlertTriangle (red circle bg)
  Value: count of overdue bookings (status='out' AND return_date < today)
  Label: "Overdue returns"
  Sub-text: "Oldest: X days overdue"
  Card bg: bg-red-50 border-red-200 (if count > 0)
  Value color: text-red-600 (if count > 0)
  Click: navigates to /bookings?status=overdue
  Shown to: all roles

ADDITIONAL CARDS (manager/owner only, 2nd row):

CARD 5 — Upcoming Pickups Today:
  Icon: ArrowDown (green circle bg)
  Value: count of bookings with pickup_date = today AND status = 'booked'
  Label: "Pickups today"
  Sub-text: "{X} already picked up"
  Shown to: manager, owner

CARD 6 — Cash Collected Today:
  Icon: Banknote (green circle bg)
  Value: formatINR(cashCollectedToday)
  Label: "Cash collected today"
  Sub-text: "UPI: ₹X | Bank: ₹Y"
  Data: SUM(booking_payments.amount) WHERE method='cash' AND date=today
  Shown to: manager, owner

### 9.6.4 Today's Schedule Widget

Split view: left half = Pickups | right half = Returns

PICKUPS today (status='booked', pickup_date = today):
  Header: "Today's Pickups" + badge count + "X done / Y pending"
  Sort: pending first, then completed

  Each booking row (shadcn Card, compact):
    Left: colored status dot (blue=pending, green=done)
    Center:
      Booking number (text-sm font-mono font-medium)
      Customer name (text-sm)
      Items: "Kurtha (M×1), Belt" (text-xs text-slate-500, truncated)
    Right:
      Balance due (text-sm font-medium text-red-600 if > 0, text-green-600 if 0)
      "Mark Pickup" button (text-xs, outline) — visible only for pending

RETURNS today (status='out', return_date = today):
  Header: "Today's Returns" + badge count
  Same row format as pickups
  "Mark Return" button for each

Empty states:
  "No pickups today" with calendar illustration
  "No returns today"

Loading: 3 shadcn Skeleton rows per column

### 9.6.5 Alerts Section

Three alert cards shown only when there's something to show:

OVERDUE ALERT:
  Red AlertTriangle icon + "X booking(s) overdue"
  Compact list of overdue bookings (max 3, "View all →" link)
  Each: booking number + customer name + "X days overdue"
  Call to action: "View overdue bookings →" → /bookings?status=overdue

WASHING ALERT (if washing items pending):
  Amber Droplets icon + "X item(s) in washing"
  Shows urgent items first (next booking within 48h)
  Each: item name + "Needed for booking on {date}"
  CTA: "View washing queue →" → /washing

LOW STOCK ALERT (manager/owner only):
  Package icon + "X item(s) low on stock"
  Each: item name + "Only {n} available"
  CTA: "View inventory →" → /inventory?filter=low_stock

### 9.6.6 Revenue Chart (manager/owner only)

shadcn Card with:
  Header: "Revenue Overview" + period selector (This Week / This Month / Last Month)
  Recharts BarChart:
    Data: daily revenue for selected period
    X-axis: date labels (Mon, Tue, etc. for week; 1,2,3... for month)
    Y-axis: ₹ amounts (formatted with en-IN locale)
    Bar color: #2563eb (blue-600)
    Bar hover: #1d4ed8
    Tooltip: "₹{amount} on {date}"
    Responsive container: 100% width, 200px height

  Below chart:
    "Total: ₹{amount}" (large, bold) + "vs last period: +X% ↑" or "-X% ↓"

Data query:
  SELECT DATE(created_at) as date, SUM(amount) as revenue
  FROM booking_payments
  WHERE business_id = current_business_id
  AND is_voided = false
  AND created_at >= period_start
  GROUP BY DATE(created_at)
  ORDER BY date ASC

# ══════════════════════════════════════════════════════════════════════
# PART 10: BOOKINGS MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 10.1 Bookings Module Overview

The bookings module is the CORE of Fabb.booking. Every rental transaction
flows through this module. It consists of:

1. Bookings List — view and filter all bookings
2. New Booking Wizard — 6-step process to create a booking
3. Booking Detail — full view with tabs
4. Pickup Flow — mark item as picked up by customer
5. Return Flow — mark items returned, assess condition

## 10.2 BOOKINGS LIST PAGE

Route: /bookings
File: app/(dashboard)/bookings/page.tsx

### 10.2.1 Page Header

Left: "Bookings" (page title, text-xl font-semibold)
Right: "+ New Booking" button (blue, navigates to /bookings/new)

### 10.2.2 Filters Bar

Status tabs (horizontal scroll):
  All | Pending | Booked | Out | Returned | Closed | Cancelled
  Active tab: bg-blue-50 text-blue-700 border-b-2 border-blue-600
  Each shows count badge

Additional filters (below tabs, in a row):
  Date range picker (shadcn Popover + Calendar):
    Quick: Today | This Week | This Month | Custom
  Search input (debounced 300ms):
    Placeholder: "Search by booking ID or customer name..."
    Searches: booking_number, customer.name, customer.phone
  Sort select (shadcn Select):
    Options: Newest first | Oldest first | Pickup date | Return date | Amount
  Filter button (opens filter sheet with more options):
    Filter by: staff member, booking source, amount range

### 10.2.3 Booking Card

Each booking displayed as a shadcn Card (list view, not grid):

Layout:
  Left: 4px colored status bar (full height)
    Pending: amber | Booked: blue | Out: violet | Returned: emerald | Closed: slate | Overdue: red

  Content (3 columns):
    Column 1 (flex-1):
      Row 1: Booking number (text-sm font-mono font-semibold) + Status badge (shadcn Badge)
      Row 2: Customer name (text-base font-semibold) + "· {phone}" (text-sm text-slate-500)
      Row 3: Items: "Kurtha Set (M×1), Belt (×1)" (text-sm text-slate-500, truncated to 50 chars)

    Column 2 (w-48):
      Pickup: CalendarArrowUp icon + date (text-sm)
      Return: CalendarArrowDown icon + date (text-sm)
      Duration: "{n} day(s)" (text-xs text-slate-400)

    Column 3 (w-32, text-right):
      Total: "₹{total}" (text-base font-semibold)
      Paid: text-green-600 if fully paid, text-red-600 if balance due
      "Balance: ₹{balance}" (text-sm text-red-600) if unpaid
      Staff: small avatar + name (text-xs text-slate-400)

  Far right: ChevronRight (→ navigate to detail)

Overdue bookings:
  Red left bar + red tint background
  "OVERDUE" badge (red) replacing status badge
  "X days overdue" in red below dates

Click anywhere on card: navigate to /bookings/{id}

### 10.2.4 Pagination

Infinite scroll (preferred) OR traditional pagination
Load 20 bookings per page
TanStack Query useInfiniteQuery
Intersection Observer triggers fetchNextPage at bottom of list

Loading more: 3 skeleton cards at bottom
Empty state: "No bookings found" with CalendarX illustration + "Create your first booking →" button

## 10.3 6-STEP BOOKING WIZARD

Route: /bookings/new
File: app/(dashboard)/bookings/new/page.tsx

### 10.3.1 Wizard Architecture

State management: Zustand bookingWizardStore
  Persists across step navigation
  Auto-saves to booking_drafts table every 30 seconds
  Draft recovered on page reload

Step indicator:
  Fixed at top of page
  5 circles connected by line
  Completed: filled blue circle + white checkmark
  Current: outlined blue circle + blue number
  Future: gray circle + gray number

Navigation:
  Back button: gray ghost button (disabled on step 1)
  Next/Continue button: blue primary button
  Cancel: "× Cancel" link (top right) → shows AlertDialog confirmation

Draft auto-save logic:
  useEffect with 30-second interval
  Saves current Zustand state to booking_drafts
  Shows "Draft saved" toast (1 second, then disappears)
  On wizard mount: checks for existing draft for this staff member
  If draft found: shows banner "You have an unsaved booking draft. Resume?"
    Resume: loads draft state into Zustand
    Discard: deletes draft, starts fresh

### 10.3.2 STEP 1 — Customer Selection

Title: "Who is this booking for?"
Subtitle: "Search for an existing customer or create a new one"

SEARCH SECTION:
  shadcn Input (large, h-12)
  Leading icon: Search (20px, text-slate-400)
  Placeholder: "Search by phone number or name..."
  Auto-focus on page load
  Debounced 300ms

Search query:
  SELECT c.*, COUNT(b.id) as total_bookings
  FROM customers c
  LEFT JOIN bookings b ON b.customer_id = c.id
  WHERE c.business_id = current_business_id
  AND (c.phone ILIKE '%{query}%' OR c.name ILIKE '%{query}%')
  GROUP BY c.id
  LIMIT 5

SEARCH RESULTS (shadcn Command list):
  Each result:
    Avatar: initials
    Name (font-medium)
    Phone (+91 XXXXX XXXXX formatted)
    Sub-text: "X bookings | Last: {date}"

  Click result:
    If blacklisted:
      Show AlertDialog: "This customer is blacklisted. Reason: {reason}. Do you want to proceed?"
      Manager can override. Staff cannot.
    If not blacklisted:
      Select customer → move to Step 2

SELECTED CUSTOMER CARD:
  After selection, shows selected customer card:
    Avatar + Name + Phone
    Booking history: "X past bookings | Last: {date}"
    "Change customer" link (small, gray)

CREATE NEW CUSTOMER:
  If search returns no results or user clicks "+ Create new customer":
  Inline mini-form slides down:
    Name (required, shadcn Input)
    Phone (required, +91 prefix + 10-digit)
    Submit: "Add customer" → INSERT into customers → auto-select
  Validation: React Hook Form + Zod

Step 1 validation:
  Cannot proceed to Step 2 without selecting a customer

### 10.3.3 STEP 2 — Select Items

Title: "What are they renting?"
Subtitle: "Search for items or scan QR code to add"

SEARCH + SCAN BAR:
  shadcn Input (large, h-12)
  Leading icon: Search
  Trailing button: QrCode icon → opens QR scanner
  Placeholder: "Search by item name or SKU..."
  Debounced 300ms

QR Scanner (html5-qrcode):
  Opens in shadcn Dialog
  Camera view with scan frame
  On scan: parses QR code format "FABB-ITEM-{uuid}" or "FABB-VARIANT-{uuid}"
  Closes scanner + auto-adds item to cart

Item search query:
  SELECT i.*, iv.*, array_agg(json_build_object('id',iv.id,'size',iv.size,'available_stock',iv.available_stock)) as variants
  FROM items i
  JOIN item_variants iv ON iv.item_id = i.id
  WHERE i.branch_id = current_branch_id
  AND i.is_active = true
  AND i.status = 'available'
  AND (i.name ILIKE '%{query}%' OR i.sku ILIKE '%{query}%' OR i.category ILIKE '%{query}%')
  GROUP BY i.id
  LIMIT 10

ITEM RESULT CARD:
  Cover image (left, 72×72px, rounded-lg, object-cover)
  Fallback: category icon placeholder
  Right:
    Item name (text-sm font-semibold)
    Category + SKU (text-xs text-slate-500)
    Daily rate: "₹{rate}/day" (text-sm font-medium text-blue-600)

  SIZE BUTTONS (below item name):
    One button per variant
    Available: bg-slate-100 text-slate-700 hover:bg-slate-200
      Label: "{size} ({available_stock} available)"
    Out of stock (available_stock = 0): bg-slate-50 text-slate-400 cursor-not-allowed
    In washing: bg-amber-50 text-amber-600 cursor-not-allowed + "In Washing" text
    Selected: bg-blue-600 text-white

  On size button click:
    Show quantity control: - [n] +
      Minimum: 1
      Maximum: available_stock for that variant
    "Add to booking" button (blue)

  On "Add to booking":
    supabase.rpc('lock_item_stock', { p_variant_id, p_quantity })
    If error: toast.error("Not enough stock available. Stock locked by another booking.")
    If success: add to cart + remove from search results

CART (bottom of page, sticky):
  Hidden when empty
  Background: white border-t shadow-lg
  Shows: X items + total amount
  Expandable: click to see full list

  Per item in cart:
    Item name + size + qty
    Subtotal (rate × qty × days, days = "TBD" until Step 3)
    Remove button (X icon)

  Running total: "Total: ₹{amount}" (days = 1 as placeholder until Step 3)

Step 2 validation:
  Cannot proceed without at least 1 item in cart

FILTERS (horizontal scroll row below search):
  Category pills: All | Kurtha | Suits | Loafers | Shoes | Cap | Accessories
  Status filter: All | Available only
  Active filter: highlighted blue pill

### 10.3.4 STEP 3 — Booking Dates

Title: "When is the rental?"
Subtitle: "Select pickup and return dates using the calendar"

CALENDAR SECTION:
  Two shadcn Calendar components side by side (desktop) / stacked (mobile)
  Left: "Pickup Date"
  Right: "Return Date"
  Uses shadcn DatePicker (based on shadcn Calendar + Popover)

PICKUP DATE:
  Minimum: today (cannot book for past)
  Disable: dates within buffer_days of another return (from branch settings)
  Selected: blue circle with white text
  Disabled: gray with strikethrough styling

RETURN DATE:
  Minimum: pickup_date (same day = 1 day rental)
  Selected: blue circle
  Range highlight: light blue between pickup and return dates

AVAILABILITY CHECK:
  After both dates selected:
  Check each item variant in cart for availability during date range
  Query: booking_items WHERE variant_id = ? AND booking.status NOT IN ('cancelled','closed')
         AND (pickup_date, return_date) OVERLAPS (selected_pickup, selected_return)
  If any item unavailable: show warning
    "Kurtha Set (M) is not available on these dates. Remove it or choose different dates."
    Option: Remove conflicting item from cart
  Update running total with actual days

DURATION DISPLAY:
  Below calendars:
  "📅 {pickupDate} → {returnDate} ({n} days)"
  "Total estimate: ₹{total} (based on {n} days)"

OCCASION SELECTOR:
  shadcn Select
  Options: Wedding | Reception | Sangeet | Mehendi | Engagement | Festival | Birthday | Function | Other
  Optional but recommended
  Used in analytics

BOOKING SOURCE (staff-facing):
  shadcn Select
  Options: Walk-in | Phone | WhatsApp | Referral | Repeat customer
  Required
  For analytics

Step 3 validation:
  Pickup date required
  Return date required (>= pickup)
  No stock conflicts

### 10.3.5 STEP 4 — Pricing Review

Title: "Booking Summary"
Subtitle: "Review and adjust pricing if needed"

ITEMS TABLE:
  shadcn Table
  Columns: Item | Size | Qty | Rate/Day | Days | Subtotal
  Each row: item details with calculated subtotal
  Footer row: "Subtotal" + total amount

PRICING OPTIONS:

Option 1 — Standard pricing (default):
  Uses daily_rate × quantity × rental_days per item
  Grand Total shown in large text

Option 2 — Override total price:
  shadcn Switch: "Apply custom price"
  When ON:
    New total price input (shadcn Input, ₹ prefix)
    Reason field (shadcn Textarea, required, "e.g. Long-term customer discount")
    Warning: "Original itemised pricing will not be shown on invoice"
  The override_amount stored separately
  Invoice will show override total

DISCOUNT SECTION (hidden by default):
  Link: "+ Add discount" (text-sm text-blue-600)
  Opens:
    Discount type: Fixed amount | Percentage
    Amount: number input
    Reason: required
  Applied to subtotal

TAX SECTION:
  "GST" toggle (shadcn Switch)
  If ON: shows calculated GST (18% = CGST 9% + SGST 9%)
  GST fields update total in real-time
  Default: OFF (most rental businesses operate without GST initially)

STEP 4 SUMMARY BOX:
  shadcn Card with bg-blue-50 border-blue-200:
    Subtotal: ₹X
    Discount: -₹X (if any)
    Tax (GST): +₹X (if any)
    TOTAL: ₹X (large, bold)

### 10.3.6 STEP 5 — Payment Collection

Title: "Collect Payment"
Subtitle: "Collect advance and deposit to confirm the booking"

PAYMENT STRUCTURE EXPLANATION:
  Info card (bg-blue-50):
    "Advance: Collected now to confirm the booking"
    "Deposit: Refundable security deposit, collected at pickup"
    "Balance: Remaining amount, collected at pickup"

ADVANCE PAYMENT:
  Amount input (₹ prefix, number)
  Default: (total × min_advance_pct / 100) from branch settings
  Minimum validation: from branch settings (e.g. 30% minimum)
  Shows: "Minimum advance: ₹{min_amount}"
  If below minimum: red warning + cannot proceed

DEPOSIT AMOUNT:
  Amount input (₹ prefix, number)
  Default: (total × deposit_default_pct / 100) from branch settings
  Can be set to 0 (no deposit required)
  Shows: "Refundable at return"

PAYMENT METHOD SELECTOR:
  4 large buttons in a 2×2 grid:
    Cash (Banknote icon)
    UPI (Smartphone icon)
    Bank Transfer (Building2 icon)
    Store Credit (Star icon)

  Active: bg-blue-600 text-white border-blue-600
  Inactive: bg-white border-slate-200

REFERENCE NUMBER (optional):
  Shows for UPI and Bank Transfer
  Input: "UTR/Transaction ID" placeholder

SPLIT PAYMENT OPTION:
  "Split into two payments" link (text-sm text-blue-600)
  When enabled: adds second payment method + amount
  Validation: sum of both amounts must equal advance amount

BALANCE DUE SUMMARY:
  After filling advance amount:
  "Balance due at pickup: ₹{total - advance}" (text-lg, shown in amber if > 0)
  "Deposit to hold: ₹{deposit}" (text-sm text-blue-600)

### 10.3.7 STEP 6 — Confirm & Invoice

Title: "Confirm Booking"
Subtitle: "Review all details before confirming"

BOOKING SUMMARY CARD:
  Customer info (name, phone)
  Booking period (pickup → return dates, duration)
  Items list (item name, size, qty, subtotal per row)
  Payment summary (advance, deposit, balance due)
  Occasion + source

INVOICE PREVIEW:
  "Preview Invoice" button → opens shadcn Dialog with PDF preview
  Full A4 invoice preview via @react-pdf/renderer

TERMS & CONDITIONS:
  Checkbox: "Customer agrees to rental terms"
    Shows: branch.settings.invoice.footer_text
  Required to be checked before confirm

CONFIRM BUTTON:
  "Confirm Booking" (blue, full width, h-12)
  Loading: "Creating booking..." with spinner

ON CONFIRM — ALL OPERATIONS IN ONE TRANSACTION:

Operation 1: Generate booking_number
  booking_number = generate_booking_number(branch_id, pickup_date)
  Format: TRT-260326-001

Operation 2: INSERT into bookings
  Status: 'booked' (not pending — booking is immediately confirmed)
  All fields filled from wizard state

Operation 3: INSERT into booking_items
  One row per item-variant-size in cart

Operation 4: Call lock_item_stock RPC for each item variant
  ATOMIC — if any fail, entire transaction is rolled back

Operation 5: INSERT into booking_payments
  Advance payment record
  Deposit payment record (if deposit > 0)

Operation 6: UPDATE customers
  total_bookings + 1
  outstanding_balance + balance_due

Operation 7: INSERT into booking_timeline
  Event: 'BOOKING_CREATED'
  All relevant field values captured

Operation 8: INSERT into audit_log
  Action: 'CREATE_BOOKING'

Operation 9: INSERT into notifications
  Overdue check scheduled (via pg_cron already running)

Operation 10: Generate and cache invoice PDF
  Store in documents bucket
  Save URL to booking

After success:
  toast.success("Booking {booking_number} confirmed!")
  Navigate to /bookings/{bookingId}
  Show invoice download button on detail page

## 10.4 BOOKING DETAIL PAGE

Route: /bookings/{id}
File: app/(dashboard)/bookings/[id]/page.tsx

### 10.4.1 Page Header

Left: 
  Booking number (text-2xl font-mono font-bold)
  Status badge (shadcn Badge, appropriate color)

Right (action buttons):
  "Download Invoice" (outline, Download icon)
  If status = 'booked': "Mark as Picked Up" button (blue)
  If status = 'out': "Mark as Returned" button (blue)
  3-dot menu (DropdownMenu):
    Edit Booking (pencil icon)
    Add Payment (plus icon)
    Send SMS (message icon)
    Cancel Booking (red, X icon)

### 10.4.2 Booking Detail Tabs

shadcn Tabs with 5 tabs:

TAB 1 — OVERVIEW:
  Two-column layout (details left, actions right)
  
  Left column:
    Customer Card:
      Avatar + name + phone (large)
      "X past bookings" + link to customer profile
      Outstanding balance badge (if any)
    
    Booking Dates Card:
      Pickup: {date} at {time if available}
      Return: {date}
      Duration: {n} days
      Status indicator with timeline (pending → booked → out → returned → closed)
    
    Items Card:
      Table: item name | size | qty | daily rate | subtotal
      Total row
    
    Notes Card:
      Public notes (visible to all staff)
      Internal notes (visible to manager+ only)
      "+ Add note" button

  Right column:
    Payment Summary Card:
      Total: ₹X
      Advance paid: ₹X (method)
      Deposit held: ₹X
      Balance due: ₹X (highlighted if > 0)
      "+ Collect payment" button
    
    Booking Info Card:
      Booking source
      Occasion
      Created by (staff name) + created at
      Last updated by + when
      Booking ID (for reference)

TAB 2 — PAYMENTS:
  shadcn Table showing all booking_payments
  Columns: Date | Type | Amount | Method | Reference | Collected By
  Type badges: Advance | Balance | Deposit | Refund | Penalty
  Voided payments: strikethrough + "VOIDED" badge in gray
  
  "Add Payment" button (top right):
    Opens shadcn Dialog
    Fields: Type, Amount, Method, Reference, Notes
    Saves to booking_payments
    Updates booking.amount_paid + balance_due
    Logs to audit_log + booking_timeline

  "Void Payment" button (per row, manager+ only):
    Opens AlertDialog: "Void this payment? This cannot be undone."
    Requires reason
    Sets is_voided = true, records voided_by, voided_at, void_reason

TAB 3 — ITEMS:
  List of items in this booking
  Each item:
    Image (48px) + name + size + qty
    Condition at booking: shown if set
    Condition at return: shown after return (excellent/good/fair/poor/damaged/missing)
    Condition notes

TAB 4 — TIMELINE:
  Chronological list of all events for this booking
  Pulled from booking_timeline table
  Each entry:
    Left: colored icon circle (by event type)
    Center: event description (bold) + details
    Right: time ago + staff name
  
  Event types:
    BOOKING_CREATED: blue CalendarPlus
    PAYMENT_ADDED: green Coins
    PAYMENT_VOIDED: red XCircle
    PICKUP_COMPLETED: violet PackageCheck
    RETURN_COMPLETED: emerald Undo2
    STATUS_CHANGED: gray RefreshCcw
    NOTE_ADDED: amber MessageSquare
    BOOKING_EDITED: gray Edit2

TAB 5 — SMS LOG:
  All SMS sent for this booking (from sms_log table)
  Columns: Date | Message preview | Status | Sent by
  "Send SMS" button: manual trigger for SMS templates
    Select template: Booking Confirmed | Pickup Reminder | Return Reminder | Overdue Notice
    Preview message with variables filled
    Confirm → invokes send-sms Edge Function

## 10.5 PICKUP FLOW

Route: /bookings/{id}/pickup
File: app/(dashboard)/bookings/[id]/pickup/page.tsx

Multi-step flow embedded in same page (no separate routes per step)
Progress: 1-2-3-4 step indicator at top

STEP 1 — Verify Customer:
  Show customer name + phone (large)
  Staff verbally verifies with customer
  "Customer present and verified" checkbox (required)

STEP 2 — Collect Balance Payment (if any):
  If balance_due > 0: payment form (same as booking Step 5)
  If balance_due = 0: "No balance due" info card, proceed directly

STEP 3 — Collect Deposit:
  If deposit_amount > 0: payment form for deposit
  If deposit collected at booking: show "Deposit already collected" + amount

STEP 4 — Confirm Pickup:
  Confirmation card showing:
    All items in booking
    "Confirm and mark as Out" button (blue, large)

ON CONFIRM:
  Update bookings.status = 'out'
  Update bookings.pickup_completed_at = now()
  INSERT booking_payments for balance (if collected now)
  INSERT booking_payments for deposit (if collected now)
  INSERT booking_timeline: PICKUP_COMPLETED
  INSERT audit_log
  Generate invoice PDF (updated with payment info)
  toast.success("Pickup confirmed! Booking is now active.")
  Navigate back to /bookings/{id}

## 10.6 RETURN FLOW

Route: /bookings/{id}/return
File: app/(dashboard)/bookings/[id]/return/page.tsx

Multi-step flow: 1-2-3 step indicator

STEP 1 — Item Condition Check:
  For each item in booking:
    Item name + size (header)
    Condition selector (shadcn RadioGroup, horizontal):
      Excellent | Good | Fair | Poor | Damaged | Missing
    Condition notes (optional textarea, expands if Damaged/Missing selected)
  "All items accounted for" checkbox (required before proceeding)

STEP 2 — Deposit Settlement:
  Deposit held: "₹{deposit_amount}" shown prominently
  
  Option A: "Return full deposit" (green button)
    Refund = full deposit amount
  
  Option B: "Deduct from deposit" (amber button)
    Shows: deduction amount input
    Calculation: Refund = Deposit - Deduction shown in real-time
    Reason required (mandatory): "Damage to {item name}: {description}"
  
  Payment method for refund: Cash | UPI | Bank Transfer
  Reference number for digital transfer

STEP 3 — Confirm Return:
  Summary:
    Items returned: ✅ {n} items
    Condition notes (if any)
    Deposit: ₹{deposit} - ₹{deduction} = ₹{refund} refunded
  
  "Confirm Return" button (blue, large)

ON CONFIRM:
  Update bookings.status = 'returned'
  Update bookings.return_completed_at = now()
  UPDATE booking_items.condition_on_return for each item
  INSERT booking_payments: type='deposit_refund', amount=refund_amount
  Update items/variants status (if applicable)
  Add to washing_queue (automatic for returned items — based on branch setting)
  INSERT booking_timeline: RETURN_COMPLETED
  INSERT audit_log
  Update customers.outstanding_balance
  toast.success("Return completed! Booking marked as returned.")
  Navigate to /bookings/{id}

AFTER RETURN:
  Booking status = 'returned' (can be closed manually by owner/manager)
  Items available again (stock released)
  Washing queue shows items needing cleaning


# ══════════════════════════════════════════════════════════════════════
# PART 11: INVENTORY MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 11.1 Inventory Overview

The inventory module manages all rental items. Each item has:
  - Multiple photos
  - Size variants with individual stock counts
  - Daily rental rate + deposit amount
  - Storage location
  - Condition tracking
  - Availability calendar

Categories: Kurtha, Suits, Loafers, Shoes, Cap, Accessories

## 11.2 INVENTORY LIST PAGE

Route: /inventory
File: app/(dashboard)/inventory/page.tsx

### 11.2.1 Page Header

Left: "Inventory" (page title)
Right: 
  "Import CSV" button (outline)
  "+ Add Item" button (blue)

### 11.2.2 Stats Bar

4 stat chips (horizontal row, small):
  Total items: X | Available: X | On Rent: X | In Washing: X

### 11.2.3 Filters

Search: "Search items..." (debounced)
  Searches: name, SKU, category, storage_location
  
Filter row:
  Category (shadcn Select): All | Kurtha | Suits | Loafers | Shoes | Cap | Accessories
  Status (shadcn Select): All | Available | On Rent | In Washing | Maintenance
  Sort (shadcn Select): Name A-Z | Recently Added | Daily Rate | Most Rented
  
View toggle: List view (default) | Grid view (2 cols mobile, 4 cols desktop)

### 11.2.4 Item List Row (list view)

Each item as a row in a styled list (not shadcn Table — custom layout):

Layout:
  Left: cover image (64×64px, rounded-lg, object-cover)
        Fallback: category icon with bg-slate-100
  
  Center (flex-1):
    Row 1: Item name (text-base font-semibold) + Category badge
    Row 2: SKU (font-mono text-sm text-slate-500) + Condition badge
    Row 3: Storage location (MapPin icon + "Rack A, Shelf 3") + Last rented date
    Row 4: Completeness bar (shadcn Progress, h-1.5, 200px wide) + "X% complete"
  
  Right:
    Daily rate: "₹{rate}/day" (text-base font-semibold text-blue-600)
    Stock summary: "{available}/{total} available" per size
    Status badge (shadcn Badge)
    Actions (shadcn DropdownMenu):
      View details
      Edit item
      Add to washing
      Mark unavailable
      Duplicate item
  
  Click row: navigate to /inventory/{id}

### 11.2.5 Item Grid Card (grid view)

shadcn Card:
  Cover image (aspect-square, object-cover, rounded-t-lg)
  Card body:
    Name + Category badge
    ₹{rate}/day
    Stock: "{available} available" (colored: green if > 0, red if 0)
    Status badge
  Click: /inventory/{id}

### 11.2.6 Empty State

Illustration: Package with + sign
Title: "No items yet"
Description: "Add your first rental item to get started"
Button: "+ Add your first item"

## 11.3 ADD ITEM FLOW

Route: /inventory/new
Method: Slide-over panel (shadcn Sheet from right) on desktop
        Full page on mobile

### 11.3.1 Quick Add Form

Fields (all in order):

Item Name (required):
  shadcn Input
  Placeholder: "e.g. Royal Kurtha Set with Dupatta"
  Auto-focus

Category (required):
  shadcn Select
  Options: Kurtha | Suits | Loafers | Shoes | Cap | Accessories

Daily Rate ₹ (required):
  shadcn Input type=number
  Prefix: "₹"
  Placeholder: "Enter rental rate per day"

Deposit Amount ₹ (optional):
  shadcn Input type=number
  Default: auto-calculated as (daily_rate × deposit_default_pct / 100)
  "Auto-calculated" helper text

Description (optional):
  shadcn Textarea (3 rows)

SKU (optional):
  shadcn Input
  "Auto-generate" checkbox (generates from category + sequential number)

Storage Location (optional):
  shadcn Input
  Placeholder: "e.g. Rack A, Shelf 3"

Condition:
  shadcn Select: Excellent | Good | Fair | Poor
  Default: Good

Photos:
  react-dropzone area
  "Drag photos here or click to upload"
  Accepts: JPG, PNG, WebP, max 5 files
  Shows thumbnails after selection
  Upload on form submit

SIZE VARIANTS SECTION:
  Title: "Add size variants" (required)
  Explanation: "If this item comes in different sizes, add each size below."

  Variant rows (dynamic):
    [Size input] [Stock count] [Remove button]
    "S" | "2" | ×
    "M" | "3" | ×
    "L" | "2" | ×
    "+ Add size" button

  If no sizes needed (accessories, bags):
    Checkbox: "No size variants (single item)"
    When checked: one variant with size="One Size" and stock = total count input

SUBMIT:
  "Save Item" button (blue, full width)
  Loading: "Saving..."

ON SUBMIT:
  1. Validate all required fields
  2. INSERT items record → get item.id
  3. Upload photos to images bucket (path: {business_id}/items/{item_id}/*.jpg)
  4. INSERT item_images records
  5. Set cover image (first photo or marked cover)
  6. INSERT item_variants for each size
  7. Calculate completeness_score
  8. INSERT audit_log: CREATE_ITEM
  9. toast.success("Item added successfully!")
  10. Navigate to /inventory/{item.id}

COMPLETENESS SCORE CALCULATION:
  cover_image_url set: +20 points
  description set: +15 points
  sku set: +10 points
  storage_location set: +15 points
  purchase_cost set: +10 points
  3+ photos: +20 points
  all variants have stock > 0: +10 points
  Total: 0-100

## 11.4 ITEM DETAIL PAGE

Route: /inventory/{id}
File: app/(dashboard)/inventory/[id]/page.tsx

### 11.4.1 Page Header

Cover image (full width, max-h-48, object-cover)
  Photo navigation: small thumbnails below, click to change main photo
  Photo count: "1 / 4" overlay

Item name (text-2xl font-bold) + Status badge
Category badge + SKU (font-mono)
Completeness bar (shadcn Progress, full width) + "X% complete"

Action buttons:
  "Edit" (outline, Edit2 icon)
  "Add to Washing" (outline, Droplets icon) — shown if item is returned
  3-dot menu:
    Mark as Unavailable / Available
    Duplicate Item
    Delete Item (destructive, AlertDialog confirmation)

### 11.4.2 Item Detail Tabs

shadcn Tabs — 5 tabs:

TAB 1 — DETAILS:

Left column:
  Basic Info Card:
    Name, Category, SKU (all editable inline)
    Condition: A/B/C/D grade selector
    Condition notes textarea
    Storage location input (with icon: Rack, Shelf, Bay inputs)
    Purchase cost + purchase date
    Description textarea

  Pricing Card:
    Daily rate ₹ (editable)
    Deposit ₹ (editable)
    Pricing history (collapsed, "View history" link)

Right column:
  Availability Quick View:
    Mini calendar showing next 30 days
    Green = available, Red = booked, Amber = washing

  Item Stats Card:
    Total rentals: X times
    Total revenue: ₹X
    Average rental duration: X days
    Last rented: {date}
    In collection since: {date}

  Size Variants Card:
    Table: Size | Total | Available | Reserved
    "+ Add size" button
    Edit stock counts inline

TAB 2 — PHOTOS:
  Photo grid (3 columns)
  Each photo:
    Thumbnail (square, object-cover)
    Hover: show "Set as cover" + delete button
    Cover photo: crown icon overlay
  
  Upload button: react-dropzone
  Photos reorderable via @dnd-kit drag-and-drop
    On drag: show drag handle
    On drop: update display_order for all photos in batch
  
  Cover photo: first in display_order unless manually set

TAB 3 — BOOKINGS:
  Active bookings for this item (status = booked or out)
  shadcn Table: Booking ID | Customer | Pickup | Return | Status

  Booking history (past): same table, collapsed with "Show history" expand

  Availability Calendar:
    Custom calendar showing booked dates for this item
    Color coding per booking status

TAB 4 — ANALYTICS:
  Recharts charts for this specific item:
    Monthly rentals bar chart (last 12 months)
    Revenue by month line chart
    Most rented size (pie chart)
  
  Period selector: Last 3 months | Last 6 months | Last Year | All time

TAB 5 — HISTORY:
  Full audit trail for this item
  Pulled from: booking_timeline (where item appears), audit_log, washing_queue
  Chronological, newest first
  Each entry: icon + event + staff + timestamp

## 11.5 INVENTORY SETTINGS

### 11.5.1 CSV Import

Route: /inventory/import
Accessible via: "Import CSV" button on inventory list

Instructions:
  "Download template" → generates CSV with headers
  Template columns: Name | Category | SKU | Daily Rate | Deposit | Size | Stock | Storage | Description

Upload:
  react-dropzone (CSV only)
  Papa Parse → client-side parsing
  Show preview table of first 5 rows

Validation per row:
  Name: required
  Category: must match allowed values
  Daily Rate: required, positive number
  Size: required (if provided)
  Stock: required, positive integer

Error display:
  Row number | Column | Error message
  "X rows valid, Y rows have errors"
  Option: "Import valid rows only" OR "Fix errors first"

On import:
  Batch INSERT items + item_variants + item_images

# ══════════════════════════════════════════════════════════════════════
# PART 12: CUSTOMERS MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 12.1 Customers Overview

Customer profiles in Fabb.booking are intentionally minimal per spec:
  Collect: name + phone only
  Optional: email

Additional tracked data (auto-generated from bookings):
  Total bookings count
  Total amount spent
  Outstanding balance
  Last booking date

## 12.2 CUSTOMERS LIST PAGE

Route: /customers
File: app/(dashboard)/customers/page.tsx

### 12.2.1 Page Header

Left: "Customers" + total count (X customers)
Right: "+ Add Customer" button (outline)

### 12.2.2 Filters

Search: "Search by name or phone..." (debounced 300ms)
Filter: All | Outstanding Balance | Blacklisted
Sort: Name A-Z | Recent bookings | Total spent

### 12.2.3 Customer List (shadcn Table)

Columns:
  Customer: Avatar + Name + Phone (combined cell)
  Bookings: total_bookings count badge
  Total Spent: formatINR(total_spent)
  Outstanding: formatINR(outstanding_balance) in red if > 0
  Last Booking: time ago
  Status: Active | Blacklisted (shadcn Badge)
  Actions: 3-dot menu (DropdownMenu)

Row actions:
  View Profile → /customers/{id}
  New Booking → /bookings/new?customer={id}
  Blacklist/Unblacklist (manager+ only)

Click row: navigate to /customers/{id}

### 12.2.4 Customer Detail Page

Route: /customers/{id}
Full page with shadcn Tabs

Header:
  Avatar (large, 72px) + Name + Phone
  Tags: X bookings | ₹X spent | Last: {date}
  Actions: "New Booking" (blue) | Edit | Blacklist (manager+)

shadcn Tabs — 3 tabs:

TAB 1 — PROFILE:
  Customer info card (editable):
    Name (shadcn Input)
    Phone (+91 prefix)
    Email (optional)
    Notes (shadcn Textarea)
  
  Stats card:
    Total bookings: X
    Total spent: ₹X
    Average booking value: ₹X
    Outstanding balance: ₹X (with "Collect payment" button if > 0)
  
  Blacklist section (manager+ only):
    Current status
    If blacklisted: reason + date + who blacklisted
    "Remove from blacklist" button (confirm)
    If not: "Blacklist customer" → AlertDialog with reason required

TAB 2 — BOOKINGS:
  Full booking history for this customer
  Same card format as bookings list
  Filterable by status
  "X total bookings | Y active | Z completed"

TAB 3 — PAYMENTS:
  All payments made by this customer across all bookings
  shadcn Table: Date | Booking ID | Type | Amount | Method
  Total: "₹X paid total"

# ══════════════════════════════════════════════════════════════════════
# PART 13: PAYMENTS MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 13.1 Payments Overview

The payments module provides a business-wide view of all financial transactions.
It is separate from individual booking payments (which are shown within each booking).

## 13.2 PAYMENTS LIST PAGE

Route: /payments
File: app/(dashboard)/payments/page.tsx

### 13.2.1 Summary Cards (manager/owner only)

4 stat cards in a row:
  Revenue Today: ₹X (cash + UPI + bank, not deposits)
  Revenue This Month: ₹X
  Deposits Held: ₹X (unreturned deposits)
  Outstanding Balance: ₹X (balance_due across active bookings)

### 13.2.2 Filters

Date range selector (shadcn Popover + Calendar)
Payment type (shadcn Select): All | Advance | Balance | Deposit | Refund
Payment method: All | Cash | UPI | Bank Transfer | Store Credit
Staff member (manager+ only)

### 13.2.3 Transactions Table

shadcn Table with columns:
  Date: formatted timestamp (DD MMM YYYY, HH:MM)
  Booking: link to booking (booking_number, font-mono)
  Customer: name
  Type: shadcn Badge (Advance=blue, Balance=violet, Deposit=amber, Refund=green, Penalty=red)
  Amount: formatINR(amount)
  Method: icon + label (Banknote=Cash, Smartphone=UPI, Building=Bank)
  Reference: UTR/transaction ID if provided
  Collected By: staff name
  Status: Active | Voided (strikethrough if voided)

Pagination: 50 rows per page with shadcn Pagination

### 13.2.4 Payment Reconciliation (manager/owner)

"Reconcile" button (top right, outline)
Opens shadcn Sheet:
  Date selector (today by default)
  Shows:
    Cash expected: ₹X (sum of cash payments for date)
    Cash counted: input field
    Difference: auto-calculated
  Notes field
  "Save Reconciliation" button

# ══════════════════════════════════════════════════════════════════════
# PART 14: WASHING QUEUE MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 14.1 Washing Queue Overview

After items are returned, they need washing before being available again.
Fabb.booking tracks this with a simple 2-stage queue:

Stage 1: In Washing → items being cleaned
Stage 2: Ready → items clean and ready for next booking

Items move automatically from In Washing to available when marked Ready.

## 14.2 WASHING QUEUE PAGE

Route: /washing
File: app/(dashboard)/washing/page.tsx

### 14.2.1 Page Header

Left: "Washing Queue"
Right: "+ Add to Queue" button (outline, for manually adding items)

Stats row:
  In Washing: X | Ready: X | Urgent: X (red badge if > 0)

### 14.2.2 Stage View

Two sections: "In Washing" and "Ready"
Toggle: List view (default) | Kanban view

IN WASHING section:
  Header: "In Washing" + count badge
  Sort: Priority (urgent first) then by added date
  
  Each item card (shadcn Card):
    Left: item cover image (48px)
    Center:
      Item name (font-semibold)
      Booking: "From booking {ID}" (text-sm text-slate-500)
      Added: "{time ago}"
      Priority badge: URGENT (red) if next booking within 48h
      "Needed for: {date}" if upcoming booking
    Right:
      "Mark as Ready" button (green, outline)
      3-dot menu: View item | View booking | Remove from queue

READY section:
  Header: "Ready" + count badge + "Mark all available" button
  
  Each item card (same layout):
    "Mark Available" button (blue) — updates item status back to available

### 14.2.3 Priority System

Priority calculation runs when item is added to washing queue:
  URGENT: next booking for this item within 48 hours
  NORMAL: next booking within 7 days or no upcoming booking
  LOW: explicitly marked low by staff

Visual indicators:
  URGENT: red badge + red left border on card
  NORMAL: no badge
  LOW: gray text

### 14.2.4 Mark as Ready Flow

Click "Mark as Ready":
  Updates washing_queue.stage = 'ready'
  Updates washing_queue.completed_at = now()
  Optional: washing cost field (for expense tracking)
  If cost entered: auto-creates expense record

Click "Mark Available" (from Ready):
  Updates item status to 'available'
  Updates item_variants.available_stock += previously_reserved
  Removes from washing queue (or marks completed)
  INSERT notification: "washing_ready" for manager

### 14.2.5 Add to Queue Manually

"+ Add to Queue" → shadcn Sheet:
  Item search (shadcn Command)
  Priority selector (Urgent | Normal | Low)
  Notes field
  Save → INSERT washing_queue record

# ══════════════════════════════════════════════════════════════════════
# PART 15: ANALYTICS MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 15.1 Analytics Overview

Access: owner + manager only (middleware protection)
Route: /analytics

Analytics is a single page with multiple chart sections and a date range selector.

## 15.2 ANALYTICS PAGE

### 15.2.1 Date Range Selector (sticky at top)

shadcn Popover with date range picker
Quick options: Today | This Week | This Month | Last Month | Last 3 Months | Custom
All charts and tables update when date range changes

### 15.2.2 Revenue Section

Card 1 — Revenue Summary:
  Total Revenue: ₹X (large, bold)
  vs Previous Period: +X% ↑ (green) or -X% ↓ (red)
  Breakdown: Cash: ₹X | UPI: ₹X | Bank: ₹X

Recharts BarChart — Revenue by Day/Week/Month:
  Toggle: Daily | Weekly | Monthly (period depends on date range)
  X-axis: dates/weeks/months
  Y-axis: ₹ amounts
  Bars: blue-600 (#2563eb)
  Tooltip: "₹{amount} — {X} bookings"
  Responsive, height 220px

### 15.2.3 Bookings Section

Stats row:
  Total Bookings: X
  New Customers: X
  Repeat Customers: X
  Average Booking Value: ₹X
  Cancellation Rate: X%

Recharts PieChart — Booking Source:
  Walk-in | Phone | WhatsApp | Referral | Repeat
  Custom colors, legend below

Recharts PieChart — Occasion Breakdown:
  Wedding | Reception | Festival | etc.

### 15.2.4 Inventory Performance Section

TanStack Table (sortable):
  Columns: Item | Category | Rentals | Revenue | Utilisation % | Avg Duration
  Utilisation = (days_rented / period_days) × 100
  Color-coded: > 70% green, 40-70% amber, < 40% red
  Sortable by any column, paginated

### 15.2.5 Staff Performance Section (manager/owner)

Per staff member:
  Name + role
  Bookings created: X
  Revenue handled: ₹X
  vs Target (if set): progress bar

### 15.2.6 P&L Statement (owner only)

Revenue section:
  Total rental income: ₹X
  Penalties collected: ₹X
  Other income: ₹X
  TOTAL REVENUE: ₹X

Expenses section:
  Pulling from expenses table by category
  Rent, Salary, Utilities, Maintenance, etc.
  TOTAL EXPENSES: ₹X

Net Profit: ₹X (Revenue - Expenses)
Profit Margin: X%

Note: "Deposits held (₹X) are not counted as revenue"

# ══════════════════════════════════════════════════════════════════════
# PART 16: STAFF MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 16.1 Staff Module Overview

Access: owner + manager only
The staff module manages team members — viewing, editing, and managing staff accounts.

Note: Staff accounts are created by Super Admin (Ansil) only.
The owner/manager can view, edit roles, and suspend staff.

## 16.2 STAFF LIST PAGE

Route: /staff
File: app/(dashboard)/staff/page.tsx

### 16.2.1 Page Header

Left: "Team" + count (X team members)
Right: "Invite via email" button (outline) — sends email with signup link

### 16.2.2 Staff Table

shadcn Table:
  Photo: shadcn Avatar (profile_photo_url or initials)
  Name + Email: two lines
  Role: shadcn Badge (Owner | Manager | Staff)
  Status: Active | Suspended (colored badge)
  Branch: branch name
  Last Login: time ago
  Actions: DropdownMenu (Edit | Change Role | Suspend | Remove)

### 16.2.3 Edit Staff (shadcn Dialog)

Editable fields:
  Name
  Phone
  Role (shadcn Select: Manager | Staff — cannot downgrade Owner)
  Branch assignment (shadcn Select)
  
Non-editable: Email (used for auth)

Change Password:
  "Send password reset email" button
  Invokes: send reset email to staff's email

### 16.2.4 Suspend Staff

AlertDialog: "Suspend {name}? They will not be able to log in."
Confirm: update staff.status = 'suspended'
Restore: reverse the above

### 16.2.5 GPS Attendance (if enabled in branch settings)

Staff detail → Attendance tab:
  Shows daily clock-in/out records
  Map showing clock-in location
  Distance from branch shown
  Valid if within gps_radius_metres, invalid if outside

Clock-in implementation:
  navigator.geolocation.getCurrentPosition
  If permission denied: ip-api.com fallback (rough)
  Calculate haversine distance to branch lat/lng
  Record as staff_attendance row

# ══════════════════════════════════════════════════════════════════════
# PART 17: SETTINGS MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 17.1 Settings Architecture

Route: /settings
File: app/(dashboard)/settings/page.tsx

Settings page uses sidebar navigation (left menu) + right content area.
This mirrors Booqable's settings architecture.

Settings sidebar menu:
  Company Profile
  Branches
  Staff
  Booking Rules
  Invoice Settings
  SMS Notifications
  Inventory Settings
  Display Preferences
  Billing (owner only)
  My Account

Each section is a separate route:
  /settings/company
  /settings/branches
  /settings/staff
  /settings/booking-rules
  /settings/invoice
  /settings/sms
  /settings/inventory
  /settings/display
  /settings/billing
  /settings/account

## 17.2 COMPANY PROFILE SETTINGS

Route: /settings/company
Access: owner only

Fields (all in one form, shadcn Card):
  Business Name (required)
  Business Logo: react-dropzone + preview + remove button
    Upload: compress → images bucket → update businesses.logo_url
  Email address
  Phone number (+91 prefix)
  Address (textarea)
  City, State, Pincode (3 inputs in a row)
  Country (Select, default India)
  Currency (Select, default INR — only INR for now)
  Timezone (Select, default Asia/Kolkata)
  GST Number (optional)
  PAN Number (optional)

Save button: "Save company profile" (blue)
  UPDATE businesses record
  INSERT audit_log: SETTINGS_UPDATED (entity: company_profile)
  toast.success("Company profile updated")

## 17.3 BRANCHES SETTINGS

Route: /settings/branches
Access: owner, manager

### 17.3.1 Branch List

shadcn Table: Branch Name | City | Prefix | Status | Actions
"+ Add Branch" button (blue)

### 17.3.2 Edit Branch (shadcn Sheet from right)

All fields — fully synced to Supabase:
  Branch Name (required)
  Address, City, State, Pincode
  Phone, Email
  Booking ID Prefix (3 letters, auto-suggested)
  GST Number (branch-specific)
  GPS Location: lat + lng fields OR "Use my current location" button
    navigator.geolocation → auto-fill lat/lng
  GPS Radius: slider (50m to 500m, default 100m)
  Opening Hours: toggle per day + time range inputs
    Mon-Sun rows with: [switch] [from time] [to time]
  Default Branch: radio button

Save: UPDATE branches record + INSERT audit_log
Full Supabase sync: all branch data immediately available to staff on next load

### 17.3.3 Branch-Specific Settings

Each branch has its own settings within branches.settings JSONB:

BOOKING RULES:
  Minimum advance %: slider 0-100% (default 30%)
  Buffer days between bookings: number 0-7 (default 1)
  Maximum advance booking window: number in days (default 180)
  Default deposit %: slider 0-50% (default 20%)

INVOICE SETTINGS (fully like Vyapar/Booqable):
  Invoice prefix: text input (default "INV")
  Next invoice number: number (auto-incrementing)
  Invoice number format preview: "INV-001"
  GST on invoices: toggle (ON/OFF)
  Invoice header: business name + logo (auto from company profile)
  Invoice footer text: textarea (up to 300 chars)
    "Thank you for choosing {business name}"
    "Items must be returned in the same condition."
  Show bank details on invoice: toggle
    Bank name, account number, IFSC inputs (shown if toggle ON)

SMS SETTINGS:
  Enable SMS: toggle (ON/OFF)
  SMS Provider: MSG91 (only option)
  API Key: password input (shows last 4 chars when set)
  Sender ID: text input (6 chars, e.g. FABBKG)
  Test SMS button: sends test SMS to owner's phone
  SMS Templates:
    Booking Confirmed: editable template with variables {name} {booking_id} {pickup_date}
    Pickup Reminder: editable
    Return Reminder: editable
    Overdue Notice: editable

## 17.4 INVOICE SETTINGS (Standalone Section)

Route: /settings/invoice
Access: owner, manager

Full invoice customisation like Vyapar:

PREVIEW:
  Left half: live A4 invoice preview (using @react-pdf/renderer in preview mode)
  Right half: settings form
  Preview updates in real-time as settings change

SETTINGS:
  Invoice Branding:
    Logo: shows business logo, "Change" button
    Business name on invoice: text input (defaults to business name)
    Tagline/subtitle: optional text input

  Invoice Header:
    GSTIN display: toggle + GST number
    PAN number: toggle + PAN
    Contact details: address, phone, email (checkboxes for each)

  Invoice Number:
    Format: [Prefix]-[YEAR]-[SEQUENCE] example: "INV-2026-001"
    Prefix: text input (up to 5 chars)
    Reset numbering: dangerous option with confirmation

  Invoice Footer:
    Terms and conditions: textarea (500 chars max)
    Bank details: bank name, account, IFSC, branch name
    Signature line: "Authorised Signatory" toggle

  GST Settings:
    Apply GST: toggle
    GST Rate: 18% (fixed for now)
    GSTIN: text input

SAVE: Updates branches.settings.invoice + logs audit

## 17.5 INVENTORY SETTINGS

Route: /settings/inventory
Access: owner, manager

Category Management:
  List of current categories with edit/delete options
  Default categories: Kurtha, Suits, Loafers, Shoes, Cap, Accessories
  "+ Add category" button → dialog with name input

SKU Format:
  Prefix per category: table with one row per category
  Format: "KUR-001" for Kurtha, "SUT-001" for Suits, etc.
  User can customise prefix per category
  Auto-number resets per category annually

Low Stock Alert:
  Threshold: number input (default 1)
  "Alert when available stock falls below X"

Depreciation Settings:
  Per category: depreciation % per year
  Used in analytics for item value calculation

## 17.6 DISPLAY PREFERENCES

Route: /settings/display
Access: all staff (personal preference)

Theme:
  Light / Dark / System (auto)
  Live preview toggle

Date Format:
  DD/MM/YYYY (default, India standard)
  MM/DD/YYYY
  DD-MMM-YYYY (e.g. 26 Mar 2026)

Currency Format:
  ₹1,00,000 (Indian lakh format)
  ₹100,000 (international format)

Language:
  English only (other languages future roadmap)

Settings saved: to localStorage for immediate effect
No server save needed (personal preference only)

## 17.7 MY ACCOUNT SETTINGS

Route: /settings/account
Access: all staff (own account)

Profile Section:
  Name (editable, updates staff.name)
  Phone (editable, updates staff.phone)
  Profile photo (react-dropzone → upload to images bucket)
  Email (read-only, cannot change without admin)

Password Section:
  Current password input
  New password input (strength meter)
  Confirm new password
  "Update password" button
    Verifies current password via bcrypt.compare
    Updates staff.password_hash with new bcrypt hash
    Logs to audit_log: PASSWORD_CHANGED

2FA / Security Section:
  "Active sessions" list: device + location + last active + "Sign out" per session
  "Sign out all other sessions" button

Account Danger Zone:
  "Contact admin to delete account" (cannot self-delete, contacts Ansil)

# ══════════════════════════════════════════════════════════════════════
# PART 18: LANDING PAGE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 18.1 Landing Page Overview

Route: fabb.com/ (public, no auth required)
Purpose: Convert visitors into business signups
Reference: Booqable's marketing page — clean, professional, conversion-focused

## 18.2 LANDING PAGE STRUCTURE

### 18.2.1 Navigation Bar

Fixed, transparent on top → solid white on scroll

Left: Fabb.booking logo + "Fabb.booking" wordmark
Center (desktop): Features | How it Works | Pricing
Right: "Sign in" (ghost) | "Start free trial" (blue button)

Mobile: hamburger menu → full-screen menu

### 18.2.2 Hero Section

Background: white
Max width: 1200px centered

Left (flex-1):
  Badge: "Made for Indian clothing rental businesses" (blue pill badge)
  Headline: "Manage your clothing rental business effortlessly"
    (text-5xl font-bold tracking-tight)
  Subheadline: "Bookings, inventory, payments and washing — all in one place. Like Booqable, built for India."
    (text-xl text-slate-500)
  
  CTA buttons:
    "Start 14-day free trial" (blue, large, h-12)
    "See how it works" (outline, large, h-12)
  
  Trust signals: "No credit card required · Cancel anytime · Free setup"

Right (flex-1):
  App screenshot / mockup (browser frame with dashboard screenshot)
  OR video demo (auto-play, muted, looped)

### 18.2.3 Features Section

Background: slate-50
Title: "Everything your rental business needs"
Subtitle: "Built specifically for Indian clothing rental shops"

6 feature cards (3×2 grid, shadcn Card):

Card 1 — Bookings:
  Icon: CalendarCheck (blue)
  Title: "Smart Bookings"
  Description: "Create bookings in seconds with our 6-step wizard. Track pickup, return and payments automatically."

Card 2 — Inventory:
  Icon: Package (blue)
  Title: "Inventory Management"
  Description: "Track every item with size variants, photos, and real-time availability. Never double-book again."

Card 3 — Payments:
  Icon: CreditCard (blue)
  Title: "Payment Tracking"
  Description: "Collect advance, deposit, and balance at the right time. Generate GST invoices instantly."

Card 4 — Washing Queue:
  Icon: Droplets (blue)
  Title: "Washing Queue"
  Description: "Track items in washing and know exactly when they'll be ready for the next rental."

Card 5 — Customers:
  Icon: Users (blue)
  Title: "Customer Profiles"
  Description: "Keep a complete history of every customer's bookings and payments in one place."

Card 6 — Analytics:
  Icon: BarChart3 (blue)
  Title: "Business Analytics"
  Description: "Understand your revenue, popular items, and business trends with clear, actionable reports."

### 18.2.4 How It Works Section

Background: white
Title: "Up and running in minutes"
4 steps in horizontal flow:

Step 1: Create your account (UserPlus icon)
  "Sign up with your business details. No setup fees."

Step 2: Add your inventory (Package icon)
  "Add your kurtha, suits, and accessories with photos and sizes."

Step 3: Start taking bookings (CalendarCheck icon)
  "Create bookings, collect payments, and track everything."

Step 4: Grow your business (TrendingUp icon)
  "Use analytics to understand what's working."

### 18.2.5 Testimonials Section

Background: slate-50
3 testimonial cards:
  Business owner photo (50px avatar)
  Name + "Owner, {Business Name}, {City}"
  Star rating (5 stars, amber)
  Quote text

### 18.2.6 Pricing Section

Background: white
Title: "Simple, transparent pricing"
Subtitle: "No hidden fees. Cancel anytime."
Note: "Contact us for custom pricing" (since no fixed plans)

Single CTA: "Talk to us about pricing" → opens WhatsApp to Ansil

OR: 3 plan cards (if Ansil decides to show plans later):
  Basic | Professional | Enterprise
  With "Contact for pricing" on each

### 18.2.7 Footer

Logo + copyright
Links: Features | Pricing | Contact | Privacy Policy | Terms of Service
Social: WhatsApp link

# ══════════════════════════════════════════════════════════════════════
# PART 19: NOTIFICATIONS MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 19.1 Notifications Overview

In-app notifications alert staff to important events.
They appear in the notification bell (header) and notification page.

## 19.2 Notification Types

All notifications stored in notifications table.

Event: overdue_booking
  Trigger: pg_cron midnight check finds out-status booking past return_date
  Title: "Booking {ID} is overdue"
  Body: "{Customer} items were due yesterday"
  Action: /bookings/{id}
  Priority: high

Event: booking_created
  Trigger: staff creates booking
  Title: "New booking: {ID}"
  Body: "{Customer} — {items} — Pickup {date}"
  Action: /bookings/{id}

Event: payment_received
  Trigger: payment added to booking
  Title: "Payment received: ₹{amount}"
  Body: "From {Customer} for booking {ID}"
  Action: /bookings/{id}

Event: washing_ready
  Trigger: item marked as ready in washing queue
  Title: "{Item} is ready"
  Body: "Available for next booking"
  Action: /washing

Event: low_stock
  Trigger: item available_stock falls below threshold (from settings)
  Title: "Low stock: {Item}"
  Body: "Only {n} {size} available"
  Action: /inventory/{id}

## 19.3 NOTIFICATION BELL (Header)

Red badge with unread count
Click → opens shadcn Sheet from right (400px)

Sheet structure:
  Header: "Notifications" + "Mark all read" button
  Filter tabs: All | Unread
  Notification list (scrollable)
  Each notification:
    Icon circle (colored by type)
    Title + body (line-clamp-2)
    Time ago + "Mark read" dot
  "View all notifications →" link at bottom

## 19.4 NOTIFICATIONS PAGE

Route: /notifications
Full page with all notifications
Filter by type
Mark as read
Delete (after 30 days auto-deleted by cron)

# ══════════════════════════════════════════════════════════════════════
# PART 20: SUPER ADMIN MODULE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 20.1 Super Admin Overview

Route: /admin (protected: super_admin role only)
Only Ansil accesses this. No other user can see this section.

## 20.2 SUPER ADMIN DASHBOARD

Stats:
  Total businesses: X (active, trial, suspended)
  Total bookings today (all businesses): X
  Total revenue today (all businesses): ₹X
  New signups this week: X

Business list (shadcn Table):
  Business Name | Owner | City | Status | Plan | Bookings | Revenue | Created | Actions

Actions per business:
  View dashboard (as that business — impersonation)
  Edit business details
  Suspend/Activate
  Change plan
  View all staff
  Reset owner password

## 20.3 STAFF MANAGEMENT (Cross-Business)

Super Admin creates staff accounts:
  Select business (from dropdown)
  Fill: name, email, phone, role, branch
  Generate temporary password (12-char random)
  Create: INSERT auth.users via admin API + INSERT staff record
  Send credentials email to staff member

## 20.4 AGGREGATE REPORTS

Revenue across all businesses by month
Top businesses by revenue
Churn indicators (businesses with zero bookings in 30 days)

# ══════════════════════════════════════════════════════════════════════
# PART 21: PDF INVOICE SYSTEM — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 21.1 Invoice Generation

Library: @react-pdf/renderer
Format: A4 (595pt × 842pt)
Generated: Client-side on demand OR server-side via Edge Function
Stored: documents Supabase Storage bucket

## 21.2 Invoice Structure

```
┌─────────────────────────────────────────────────────────┐
│  [LOGO]    RAJ BRIDAL COLLECTIONS                        │
│            123 Main Street, Thrissur, Kerala 680001      │
│            Phone: +91 98765 43210 | GST: 32XXXXX         │
│                                           RENTAL INVOICE  │
│                                     Invoice #: INV-2026-001│
│                                     Date: 26 March 2026  │
├─────────────────────────────────────────────────────────┤
│  BILL TO:                  BOOKING DETAILS:              │
│  Rahul Kumar               Booking ID: TRT-260326-001    │
│  +91 98765 43210           Pickup: 26 March 2026         │
│                            Return: 28 March 2026         │
│                            Duration: 2 days              │
├─────────────────────────────────────────────────────────┤
│  ITEM                SIZE  QTY  RATE/DAY  DAYS  SUBTOTAL │
│  ─────────────────────────────────────────────────────── │
│  Royal Kurtha Set    M     1    ₹800      2     ₹1,600   │
│  Designer Belt       Free  1    ₹200      2     ₹400     │
│  ─────────────────────────────────────────────────────── │
│                                    Subtotal:   ₹2,000   │
│                                    Discount:      ₹0    │
│                                    TOTAL:     ₹2,000    │
├─────────────────────────────────────────────────────────┤
│  PAYMENTS COLLECTED:                                     │
│  26 Mar 2026  Advance  ₹600  Cash                        │
│  26 Mar 2026  Deposit  ₹400  Cash  (Refundable)          │
│  ─────────────────────────────────────────────────────── │
│  Amount Collected: ₹1,000 | Balance Due at Pickup: ₹1,000│
├─────────────────────────────────────────────────────────┤
│  Terms: All items must be returned in original condition. │
│  Damage charges may apply for damaged/missing items.     │
│                                    Authorised Signatory   │
│                              Raj Bridal Collections       │
└─────────────────────────────────────────────────────────┘
```

## 21.3 Invoice Access Points

Access from: booking detail page → "Download Invoice" button
Also: booking list → 3-dot menu → "Download Invoice"

Invoice generation:
  1. Fetch complete booking data (all joins)
  2. Fetch business + branch settings (for invoice config)
  3. Render @react-pdf/renderer document
  4. Download as PDF: "Fabb-Invoice-{booking_number}.pdf"
  5. Optional: upload to documents bucket + save URL


# ══════════════════════════════════════════════════════════════════════
# PART 22: SECURITY ARCHITECTURE — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 22.1 Security Layers

Fabb.booking employs defense-in-depth security with 4 distinct layers:

LAYER 1 — Next.js Middleware (Edge):
  Checks authentication session on every request
  Checks staff.status = active
  Checks role-based route access
  Redirect unauthorized requests before any data is loaded

LAYER 2 — Supabase Row Level Security (Database):
  Every table has RLS enabled
  Every query automatically filtered by business_id/branch_id
  Even if someone bypasses middleware, DB will not return wrong data
  This is the MOST IMPORTANT security layer

LAYER 3 — API Route Validation:
  All API routes validate inputs with Zod
  All API routes use admin Supabase client (service role)
  Rate limiting on login endpoint
  CSRF protection via Next.js built-in

LAYER 4 — Client-Side Auth State:
  Zustand authStore cleared on logout
  Session cookies httpOnly (managed by @supabase/ssr)
  No sensitive data stored in localStorage

## 22.2 Password Security

  bcrypt with 12 salt rounds
  Password requirements: min 8 chars, 1 uppercase, 1 number
  Temporary passwords: crypto.randomUUID().slice(0,12) (48 bits entropy)
  Reset tokens: encode(gen_random_bytes(32), 'hex') (256 bits entropy)
  Tokens expire: 1 hour
  Tokens single-use: used_at column set on use

## 22.3 Rate Limiting

  Email login: 5 attempts per 15 minutes per email
  Failed attempt tracking: login_attempts table
  Lock message: "Too many failed attempts. Try again in X minutes."
  IP-based tracking: x-forwarded-for header

## 22.4 Audit Logging

  Every INSERT, UPDATE, DELETE logs to audit_log table
  Immutable: no UPDATE or DELETE on audit_log (RLS enforces insert-only for staff)
  Fields: action, entity_type, entity_id, old_values, new_values, staff_id, ip, timestamp
  Retention: permanent (no auto-delete)
  Access: owner + manager can view own business audit log; super_admin sees all

## 22.5 Session Management

  Supabase JWT sessions
  Default expiry: 1 hour (access token) + 7 days (refresh token)
  "Remember me": extends to 30 days
  Sign out: supabase.auth.signOut() clears all tokens and cookies
  "Sign out all sessions": admin.auth.admin.deleteAllSessionsForUser() (super_admin)

## 22.6 File Storage Security

  images bucket: public (intentional — item photos are public, no PII)
  documents bucket: private (Aadhaar, invoices)
  documents access: signed URLs with 1-24 hour expiry
  Storage RLS: bucket-level policies restrict to business files only

# ══════════════════════════════════════════════════════════════════════
# PART 23: DEPLOYMENT — COMPLETE SPECIFICATION
# ══════════════════════════════════════════════════════════════════════

## 23.1 Infrastructure

Frontend: Vercel
  Domain: fabb.com (custom domain)
  Build: npm run build (Next.js static + SSR)
  Environment: production (auto-deploy from main branch)
  Edge functions: Next.js middleware runs on Vercel Edge

Backend: Supabase Cloud
  Region: ap-south-1 (Mumbai) — MANDATORY for Indian latency
  PostgreSQL 15+
  pgvector: not needed
  pg_cron: enabled
  Realtime: enabled

## 23.2 Environment Variables

.env.local (development) / Vercel environment variables (production):

NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]  (server-only, never expose)
NEXTAUTH_SECRET=[random_string_32_chars]

Supabase Edge Function Secrets (Dashboard → Settings → Secrets):
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
MSG91_API_KEY=[msg91_api_key]
MSG91_SENDER_ID=[approved_sender_id]
RESEND_API_KEY=[resend_api_key]

## 23.3 GitHub Actions CI/CD

.github/workflows/deploy.yml:
  Trigger: push to main branch
  Steps:
    1. Checkout code
    2. Setup Node.js 20
    3. npm ci (install dependencies)
    4. npm run type-check (TypeScript check)
    5. npm run lint (ESLint)
    6. npm run build (Next.js build — catches any build errors)
    7. Vercel deploy (via Vercel GitHub integration, auto-deploys)

## 23.4 Local Development Setup

1. Clone repository: git clone {repo}
2. npm install
3. Copy .env.example to .env.local, fill values
4. supabase start (local Supabase via Docker)
5. npm run db:migrate (run all migration files)
6. npm run dev
7. Open http://localhost:3000

supabase/migrations/ folder:
  All migrations numbered sequentially
  Each migration file: SQL only (no JS)
  Applied automatically to local and production via supabase db push

## 23.5 Vercel Configuration

vercel.json:
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(self), geolocation=(self)" }
        ]
      }
    ]
  }

# ══════════════════════════════════════════════════════════════════════
# PART 24: BUILD ORDER — PHASE BY PHASE DEVELOPMENT PLAN
# ══════════════════════════════════════════════════════════════════════

## Phase 1: Foundation (Week 1-2)

1.1 Project Setup:
  Next.js 14+ App Router project
  TailwindCSS + shadcn/ui init
  Inter font setup
  next-themes (dark/light mode)
  Supabase project created (Mumbai ap-south-1)
  All dependencies installed

1.2 Database:
  Run all SQL migrations in Supabase SQL Editor
  Enable all extensions (uuid-ossp, pg_cron)
  Enable Realtime on key tables
  Create storage buckets (images, documents)
  Generate TypeScript types: npx supabase gen types typescript > types/supabase.ts

1.3 Authentication:
  middleware.ts (route protection)
  Login page (email + Google)
  API route: /api/auth/login
  Google OAuth callback: /auth/callback
  Signup page + API route: /api/auth/signup
  Forgot password + reset password

1.4 Layout:
  Dashboard layout (sidebar + header)
  Sidebar component (all nav items, role-based visibility)
  Header component (search, notifications bell, user menu)
  Theme provider wrapper
  Notification Realtime subscription

## Phase 2: Core Business (Week 3-5)

2.1 Dashboard:
  Stat cards (all 6 cards, role-based)
  Today's schedule (pickups + returns)
  Revenue bar chart
  Alert widgets (overdue, washing)

2.2 Bookings — Full Module:
  Bookings list page with filters
  6-step booking wizard (all steps)
  Booking detail page (all 5 tabs)
  Pickup flow (all steps)
  Return flow (all steps)
  Booking draft auto-save

2.3 Inventory — Full Module:
  Inventory list with filters
  Add item form (slide-over)
  Item detail page (all 5 tabs)
  Photo upload + reorder
  Size variant management
  CSV import

## Phase 3: Supporting Modules (Week 6-8)

3.1 Customers (list + detail + booking history)
3.2 Payments (list + filters + reconciliation)
3.3 Washing Queue (2-stage, priority, bulk actions)
3.4 Analytics (revenue chart, bookings, inventory, P&L)
3.5 Staff module (list, edit, GPS attendance)

## Phase 4: Settings (Week 9)

4.1 Company profile
4.2 Branches (add/edit + full Supabase sync)
4.3 Booking rules (all configurable per branch)
4.4 Invoice settings (full Vyapar/Booqable parity)
4.5 SMS settings (MSG91 integration + templates)
4.6 Inventory settings (categories, SKU format)
4.7 Display preferences
4.8 My account (password change, profile)

## Phase 5: PDF Invoice + SMS (Week 10)

5.1 @react-pdf/renderer invoice template (full A4)
5.2 Invoice customisation applied
5.3 MSG91 Edge Function (send-sms)
5.4 SMS template management
5.5 Manual SMS send buttons throughout app

## Phase 6: Landing Page + Polish (Week 11-12)

6.1 Landing page (all sections)
6.2 Setup wizard (5 steps)
6.3 Super Admin panel
6.4 Notifications page
6.5 Error handling throughout (error boundaries, error pages)
6.6 Loading states (skeletons everywhere)
6.7 Empty states (all lists)
6.8 Mobile responsiveness audit
6.9 Performance audit (Lighthouse)

## Phase 7: Testing + Launch (Week 13-14)

7.1 End-to-end testing (Playwright):
  Full booking flow (create → pickup → return)
  Payment collection
  Inventory management
  Staff login/logout

7.2 Unit testing (Vitest):
  Utility functions
  Form validation schemas
  Business logic functions

7.3 User acceptance testing:
  Owner tests all features
  Staff members test booking flow

7.4 Production deployment:
  Configure Vercel production environment
  Configure custom domain (fabb.com)
  Run migrations on production Supabase
  Test critical paths on production
  Monitor error rates via console.error logging

# ══════════════════════════════════════════════════════════════════════
# PART 25: EVERY SESSION START — WHAT TO DO
# ══════════════════════════════════════════════════════════════════════

## How to Start Every Claude Code Session

1. Read this CLAUDE.md file first (fully)
2. Run: ls -la to see current project state
3. Run: ls supabase/migrations/ to see which migrations exist
4. Run: npm run build to check for TypeScript errors (fix before adding)
5. Identify what phase you're in (see Phase plan above)
6. Pick ONE feature to build completely end-to-end
7. Build: database (if needed) → types → API → UI → test
8. Run: npm run build after each feature (zero errors before moving on)
9. Never rebuild what already exists — check first

## Common Mistakes to Avoid

MISTAKE 1: Using spinners instead of shadcn Skeleton
  Always use: <Skeleton className="h-4 w-full" /> for loading states

MISTAKE 2: Forgetting business_id in Supabase queries
  Every query must be scoped: .eq('business_id', businessId)
  Get businessId from: useAuthStore().staff?.business_id

MISTAKE 3: Not logging to audit_log after writes
  After every INSERT/UPDATE/DELETE:
  await logAudit({ action, entityType, entityId, oldValues, newValues })

MISTAKE 4: Building custom components when shadcn has one
  Before building any UI component: check if shadcn/ui has it
  If yes: use it. Customise with Tailwind. Don't rebuild from scratch.

MISTAKE 5: Not handling loading states
  Every page that fetches data needs Skeleton loading state
  Pattern: if (isLoading) return <PageSkeleton />

MISTAKE 6: Wrong date handling
  Always store dates as timestamptz (UTC) in Supabase
  Always display in IST: toZonedTime(utcDate, 'Asia/Kolkata')
  Format for display: format(date, 'dd MMM yyyy', { timeZone: 'Asia/Kolkata' })

MISTAKE 7: Forgetting RLS on new tables
  After every CREATE TABLE: add alter table X enable row level security
  Add at least one policy before testing

MISTAKE 8: SMS auto-sending
  SMS is ALWAYS manual. Staff taps "Send SMS" button.
  Never auto-send SMS without explicit staff action.