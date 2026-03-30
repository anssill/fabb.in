# Echo — Product Requirements Document
**Version 1.0 | Confidential**
**Owner: Ansil | Status: Final — Ready for Development**

---

## Table of Contents
1. Executive Summary
2. Product Overview
3. Brand Identity
4. Tech Stack & Architecture
5. User Roles & Permissions
6. Section 1: Dashboard
7. Section 2: Bookings
8. Section 3: Inventory
9. Section 4: Customers
10. Section 5: Washing Queue
11. Section 6: Payments & Finance
12. Section 7: Staff & HR
13. Section 8: Analytics
14. Section 9: Calendar
15. Section 10: Settings
16. Section 11: Expenses
17. Section 12: Franchise
18. Section 13: Security & Audit
19. Section 14: Notifications & WhatsApp
20. Section 15: Landing Page & Plans
21. Section 16: Data Sync & Offline
22. Section 17: Database & Infrastructure
23. Section 18: Sprint Roadmap

---

## 1. Executive Summary

Echo is a multi-tenant, India-first, internal clothing rental management SaaS. It is built for clothing rental businesses to manage bookings, inventory, customers, washing, payments, staff, and franchise operations from a single platform. Echo is designed to scale to a million-dollar SaaS, serving multiple clothing rental businesses across India under a franchise model. Each approved business gets its own subdomain (businessname.echo.app) with full data isolation via Supabase RLS.

**Vision:** The definitive operating system for clothing rental businesses in India.
**Market:** India-first (INR/GST/Asia/Kolkata timezone)
**Delivery Model:** Self-pickup only
**Payment:** Staff-managed (Cash, UPI, Bank Transfer, Store Credit with manager approval)

---

## 2. Product Overview

### Core Modules
- Dashboard (role-based, real-time)
- Bookings (6-step creation, pickup, return flows)
- Inventory (variants, QR labels, washing tracking)
- Customers (tiers, risk, loyalty, blacklist)
- Washing Queue (stage tracking, SLA, vendor)
- Payments & Finance (reconciliation, P&L)
- Staff & HR (attendance, performance, documents)
- Analytics (revenue, bookings, utilisation, P&L)
- Calendar (Gantt availability view)
- Settings (branch, print, roles, integrations)
- Expenses (daily logs, Notion sync)
- Franchise (multi-branch, royalty, transfers)
- Security & Audit (full audit trail, sessions)
- Notifications (in-app bell, WhatsApp manual)
- Landing Page (marketing + Super Admin onboarding)

### Item Categories
**Women's:** Lehenga, Saree, Salwar Kameez, Gown, Anarkali
**Men's:** Kurtha, Suit, Sherwani, Jodhpuri, Bandhgala
**Accessories:** Shawl, Dupatta, Jewellery, Belt, Mojri, Loafer

---

## 3. Brand Identity

- **Product Name:** Echo
- **Primary Color:** #CCFF00 (Electric Yellow-Green / Chartreuse)
- **Logo Mark:** Black abstract pinwheel/burst icon
- **Logo Background:** Brand primary (#CCFF00)
- **Text:** #000000 on primary, #FFFFFF on dark backgrounds
- **Font:** Inter or Geist (system-level)
- **Tone:** Bold, modern, fast, India-first

---

## 4. Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 14+ (App Router + Server Components)
- **Styling:** TailwindCSS + shadcn/ui + custom design system
- **State:** Zustand (global) + TanStack Query (server state)
- **Language:** TypeScript (strict mode)
- **Testing:** Playwright (E2E) + Vitest (unit)

### Backend
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth — Google OAuth only (approval-based, Google login does NOT bypass manager approval)
- **Storage:** Supabase Storage — separate buckets per file type (photos / documents / receipts)
- **Realtime:** Supabase Realtime subscriptions (ALL data)
- **Edge Functions:** Notion sync + WhatsApp Business API + cron jobs (overdue status, royalty calc)
- **RLS:** Row-Level Security per branch + row-level isolation per business

### Integrations
- **Notion API** — bookings, P&L, inventory, washing history auto-synced via Edge Function webhooks
- **WhatsApp Business API (Meta)** — manual messages sent by staff (no auto-send)
- **Google OAuth** — authentication only

### Deployment
- **Frontend:** Vercel (Next.js native)
- **Backend:** Supabase Cloud (ap-south-1 Mumbai region)
- **Subdomains:** businessname.echo.app via Vercel subdomain routing
- **CI/CD:** GitHub → Vercel auto-deploy

### Printer
- **Model:** Vyapar VYPRTP3001 (3-inch/68mm thermal, Bluetooth + USB)
- **Configuration:** Fully customisable in Settings → Print Settings

---

## 5. User Roles & Permissions

| Role | Access Level |
|------|-------------|
| Super Admin | Full system access — all branches, all businesses, franchise panel, billing, impersonation |
| Store Manager | Full branch access — all features, staff management, analytics, approvals |
| Floor Staff | Bookings, inventory, customers, washing, payments — no analytics, no staff management |
| Auditor | Read-only across all sections |
| Custom Roles | Created by Super Admin only with configurable permission sets |

**Key access rules:**
- All staff + manager + Super Admin can create bookings and edit inventory items
- Analytics visible to manager + Super Admin only
- Audit trail visible to Super Admin only
- Price change log visible to Super Admin only
- Custom roles created by Super Admin only
- Session expires after configurable hours of inactivity
- PIN required for logout confirmation + manual lock

---

## 6. Section 1: Dashboard

### Layout
- **Default view:** Today's summary (pickups + returns + washing)
- **Navigation:** Left sidebar (collapsible to icons on desktop)
- **Theme:** Light default (staff can switch)
- **Top bar:** Store logo + staff name + branch (left) | Bell + PIN lock + date/time live clock (right)
- **Mobile tabs:** Dashboard / Bookings / Inventory / Customers / More
- **Loading:** Skeleton screens
- **Offline:** Yellow banner at top

### Stat Cards (Top Row)
1. Revenue live counter (real-time)
2. Today's pickups count
3. Today's returns count
4. Overdue count (red badge)
5. Staff on duty now

### Quick Actions
- + New Booking → redirects to booking Step 1
- Mark Return → opens booking search first
- Open Scanner → asks: scan item QR or booking QR
- Add Inventory Item
- View Today's Schedule

### Widget Grid
- **Revenue goal widget:** ₹ amount remaining + progress bar
- **Performance scorecard:** Today vs yesterday / week vs week / monthly target / staff score vs target
- **Weekly revenue chart:** Last 7 days bar chart
- **Washing summary:** Count + urgent count + next ready item
- **Mini-widgets:** Top 3 items rented this week | Today's revenue vs yesterday | Washing queue urgent count
- **Upcoming week strip:** Mini calendar (next 7 days booking density)
- **Outstanding customer balance:** ₹ total owed across active bookings
- **Inventory availability:** Count of items available now
- **Deposit liability:** Card showing total deposits held
- **Today's expenses:** Manager only — today's total (salaries, commission, overtime)
- **NPS trend:** Mini card with score
- **GST collected:** Super Admin only
- **Projected revenue:** Based on remaining pickups

### Alert Centre
- Overdue list (colour-coded by days late)
- Washing URGENT items
- Pending approvals (manager + above only)
- Low stock alerts
- Blacklisted customer attempted booking

### Schedule Widget
- Grouped by status (pickups first, then returns)
- Colour = staff-chosen scheme
- Tap entry → booking detail slide-over (from right)
- Swipe left on mobile → quick actions (return/print/WhatsApp)
- Overdue highlighted in red + sorted to top

### Franchise Summary (Super Admin)
- All branches revenue side-by-side (live)
- Most overdue branch
- Pending approvals per branch
- Total franchise revenue this month vs last
- Lowest NPS branch

### Role-Based Views
- **Floor Staff:** Schedule + new booking only
- **Manager:** Full + revenue + approvals + staff attendance
- **Super Admin:** All + franchise summary
- **Auditor:** Read-only

### Real-Time Updates (Supabase Realtime)
- Revenue counter (instant)
- Washing queue count (instant)
- Overdue at midnight (cron job)
- New booking appears in schedule (instant)
- Booking cancelled (instant)

### Other Dashboard Features
- Global search bar (search anything)
- Handover notes banner (visible to all staff)
- Opening checklist (staff completes before dashboard unlocks, flagged if incomplete after 30 min)
- Announcements banner (above all widgets)
- Manual PIN lock icon in top bar
- Sound + vibration on new notifications
- Pending tasks badge on sidebar + widget
- Pull-to-refresh (all sections reload)
- Critical alerts: full-screen popup (blocks all actions)
- Undo toast for destructive actions (5 seconds)
- Data auto-refresh every 30 seconds
- Sidebar: manager sets widget/menu order for all staff
- Dashboard footer: Store name + branch + version + support link
- Widget customisation: manager sets layout, staff cannot change
- Sidebar badge: overdue pill + pending approvals dot (manager+)
- Revenue goal: inside main widget grid
- Notification inbox: actions depend on type (approve/reject inline)

---

## 7. Section 2: Bookings

### 6-Step Booking Creation Flow

**Step 1 — Customer**
- Search by phone number
- If not found → create customer inline (name + phone mandatory) without leaving booking
- Customer card shows: name + phone

**Step 2 — Items**
- Search by name/SKU or scan item QR code
- Item card shows: photo + name + SKU + sizes with exact stock count (e.g. M: 3 available)
- Size buttons (S/M/L/XL) with quantity +/- per size
- Maximum quantity per size = actual stock available (cannot exceed)
- Greyed out with "In Washing" label if not ready
- Category + colour + occasion filter available
- Colour shown as text label only (no swatch)
- Tag search as separate filter only
- No AI outfit/size suggestions
- Selected items: summary bar at bottom (name + sizes + quantities + subtotal)
- Tap X on item card to remove
- Single price for all sizes per item
- Deposit shown in Step 5 only
- Accessories searched and added separately (no auto-pairing suggestions)
- Running total updates as items added
- Item stock locked immediately when added to cart
- Draft auto-saved at every step transition

**Step 3 — Dates**
- Calendar date picker for pickup date + return date
- No return time slot (just return date)
- Advance booking window configurable (e.g. max 6 months ahead)
- Buffer day enforced between bookings (washing time)

**Step 4 — Pricing**
- Auto-calculated: daily rate × number of days
- Same-day pickup + return = 1-day rate
- Staff can apply price override: replaces original price (original NOT shown), mandatory reason required
- No coupon system (discount via price override only)
- Price override shown in pricing breakdown as replaced price

**Step 5 — Payment**
- Staff selects payment method + enters advance amount + deposit amount separately
- Split payment: 2 methods in 1 transaction (e.g. Cash + UPI)
- Store credit: manager approval required
- Minimum advance % enforced (configurable)
- Deposit shown separately with "Refundable" label
- No GST invoice (thermal receipt only)

**Step 6 — Confirm**
- Thermal receipt preview on screen before printing
- Full summary shown
- Confirm → QR label auto-sent to printer

### Booking Creation Rules
- **Minimum to confirm:** Customer + items + dates + minimum advance payment
- **Progress indicator:** Numbered circles at top (1–6)
- **Back navigation:** Yes — any step without data loss
- **Draft expiry:** No expiry — staff can complete anytime
- **Draft location:** Listed in bookings section with "Draft" status badge
- **Booking ID format:** Branch prefix + date + sequence (e.g. TRT-260326-001)
- **Notion sync:** Notion page auto-created for every new booking

### Booking List
- **Layout:** List with filters + search + status tabs
- **Status filters:** All / Pending / Confirmed / Active / Returned / Overdue / Cancelled + date range + staff + payment status
- **Card shows:** Booking ID + customer name + items + dates + status badge + payment badge
- **Status badges:** green=confirmed / blue=active / red=overdue / grey=returned
- **Overdue:** Sorted to top + red highlight
- **Sort:** Newest first / oldest / pickup date / return date / amount
- **Search:** ID / customer name / phone / item name / SKU
- **Pagination:** Load 20 + infinite scroll
- **Summary stats:** Total count + total revenue this period at top
- **Sidebar badge:** Total active bookings count
- **Today's bookings:** On dashboard schedule only (not in booking list)
- **Bulk export:** By date range as Excel

### Booking Detail Page
**Layout:** Tabbed — Details / Payments / Items / Notes / Timeline

**Details tab:**
- Booking ID as large text + QR code at top (tap to copy)
- Customer name + phone + tier (tier badge not shown in booking — only in customer profile)
- Items + size + quantity + condition grade
- Payment breakdown
- Pickup date + return date
- Staff attribution: created by + created at + last edited by + last edited at
- CCTV timestamp + camera zone field (e.g. Counter A) — auto-logged at pickup confirmation
- Booking source (walk-in / WhatsApp / referral / phone call)
- No WhatsApp log on booking detail (only in notifications section)
- Occasion field

**Payments tab:**
- Advance / balance / deposit / penalty as separate rows with method + staff + timestamp

**Items tab:**
- Item name + size + quantity only (no photos on items tab)

**Notes tab:**
- Any staff can add notes, only manager can view
- Manager can pin 1 note

**Timeline tab:**
- Every status change + payment + edit + staff name + timestamp

**Action buttons on booking detail:**
- Print Receipt
- Mark Pickup (if not yet picked up)
- Edit Booking
- Cancel Booking
- Add Payment
- Print Label (customer name + items + return date)
- Mark as Returned (any staff, on active bookings)
- Share (sends booking ID + pickup date only)

### Pickup Flow
**Initiation:** Scan booking QR or search by ID/phone → opens booking + staff must manually tap "Start Pickup"

**Steps:**
1. Aadhaar front + back photo upload (pickup time only — NOT at booking creation)
2. Item condition check + before-photo (optional — staff can skip)
3. Collect balance + deposit
4. Customer signs physical receipt (no digital signature)
5. Accessories checklist (tick each accessory at pickup)
6. Print thermal receipt + staff sends WhatsApp manually

**On completion:** Booking status auto-changes to Active

### Return Flow
**Initiation:** Scan item QR or search by ID/phone

**Steps:**
1. Item condition per item: Excellent / Good / Damaged / Missing
2. Deposit decision: Release All / Deduct Amount (staff enters amount + reason)
3. Accessories checklist (tick items returned)
4. Manually add to washing queue (auto-add is NOT on by default)
5. Print return receipt + staff sends WhatsApp manually

**Partial return:** Yes — mark some items, booking stays active for rest
**On all items returned:** Status auto-changes to Returned

### Status Automations
- **Overdue:** Auto-applied by midnight cron job (Supabase Edge Function)
- **Active:** Auto when all pickup steps completed + confirmed
- **Returned:** Auto when all items marked returned

### Other Booking Features
- **Item swap:** Allowed + triggers new availability check
- **Customer change:** Any staff can change
- **Extend return date:** Any staff can extend anytime (logged: old date + new date + staff)
- **Cancel booking:** Any staff with mandatory reason
- **Edit confirmed booking:** Any staff can edit any field anytime
- **Receipt reprint:** Anytime from booking detail (logged in audit)
- **Payment void:** Any staff can void with reason
- **Additional payment:** Any staff can add anytime from booking detail
- **Duplicate detection:** Warning shown but staff can proceed
- **Blacklisted customer:** Level 1=warning, Level 2=manager override, Level 3=hard block
- **High-risk customer:** Booking auto-holds for manager approval
- **Multiple active bookings per customer:** Allowed (no restriction)
- **Pre-booking hold:** Items held X days without payment (configurable)
- **Inter-branch transfer:** Super Admin approval required
- **Accessories checklist items:** Dupatta / Mojri / Jewellery / Belt — tracked at pickup AND return
- **Waitlist:** 4-hour confirmation window on availability
- **Occasion field:** Wedding / Reception / Mehendi / Festival / Party / Other
- **Damage report:** Auto-generated PDF (before/after photos + condition notes + charges)
- **Rental terms:** Printed on receipt bottom
- **Bundle/package booking:** Manager creates preset outfit packages in settings
- **Booking source:** Walk-in / WhatsApp / Referral / Phone call
- **Overdue penalty:** Staff manually enters amount at return
- **Penalty waiver:** Any staff can waive with reason (logged in audit)
- **Deposit waiver:** Any staff can waive with reason (logged in audit)
- **No-show:** Manager gets alert + manually cancels
- **CCTV timestamp + camera zone:** Auto-logged at pickup
- **Staff can initiate booking from inventory item page:** Yes (Book This Item → availability calendar → booking flow)

---

## 8. Section 3: Inventory

### Inventory List
- **Default view:** Staff chooses (saved per account/staff)
- **Filters:** Category/sub-category / Status / Condition grade / Colour-Occasion tag / Price range / Date added
- **Item card:** Name + SKU + cover photo + status badge + condition grade + price + rental count + last scanned
- **Sort options:** Name / SKU / date added / price / utilisation rate / condition (saved per staff)
- **Summary stats at top:** Total items / Available / In booking / In washing
- **Search:** Name / SKU / barcode / storage location (main search bar searches all these)
- **Tag search:** Available as separate filter only (not in main search bar)
- **Tap card:** Opens full item detail page
- **Bulk operations:** Status change / QR label print / price update (%) — select multiple → apply to all

### Item Detail Page
**Tabs:** Details / Photos / Bookings / Washing / Pricing / Analytics / Timeline

**Details tab:**
- Name, SKU (manually assigned), category, sub-category
- Condition grade (A/B/C) — updated only if damage found at return
- Grade C items can still be booked (staff decides)
- Storage location: Rack + Shelf + Bay (e.g. Rack A / Shelf 3)
- Internal notes (staff only, never printed)
- Item age tracker: days since purchase date
- Colour (text label only)
- Occasion tags / fabric tags / embellishment tags / custom tags
- Pairing database: admin defines complementary pairs (Lehenga → Mojri + Dupatta)
- Collections: items can belong to multiple (Bridal Exclusive, Eid Collection, Premium)
- Completeness score: % (photos + desc + tags + pricing)
- Depreciation: % per year per category, book value auto-calculated
- Last scanned: timestamp shown on item card + detail
- Next booking date: shown on item detail

**Photos tab:**
- Multiple photos — cover photo selection (tap to set as cover)
- Display order control
- Photo watermark: optional toggle per branch
- Upload: camera or gallery — staff manually crops before saving
- No photo quality check
- No AI photo tagging

**Bookings tab:**
- Active bookings: customer name + dates
- Full booking history

**Washing tab:**
- All wash entries: date + staff + cost
- Washing history auto-pushed to Notion monthly

**Pricing tab:**
- Daily rate (price = daily rate × number of days, no tiers)
- All variants share same price as parent item
- Deposit %: configurable per item + per variant
- Price change history: logged, visible to Super Admin only

**Analytics tab:**
- Item revenue + monthly trend chart
- Rental count (total times rented)
- No ROI calculation

**Timeline tab:**
- Full history: bookings + washing + repairs + status changes + price edits + scans

### Inventory Management
- **New item flow:** Quick add (name + category + price) → "Complete this item" checklist → QR label auto-sent to printer (no prompt)
- **Variant system:** Parent item → child variants (size/colour), each has own QR + availability
- **Batch variant creation:** Fill parent once → all variants auto-generated
- **Duplicate item:** Creates new variant under same parent (warning if same name+category)
- **Pause item:** No new bookings allowed, existing unaffected, shown greyed out in list
- **No off-season status**
- **Repair tracking:** Status changes to "In Repair" + item unavailable during repair
  - Fields: vendor name + cost + status + return date
- **Missing item flag:** Any staff can flag → manager alerted
- **Bulk import:** CSV with downloadable template + row-by-row validation
- **Write-off:** Super Admin approval required
- **Retirement:** Status → Retired, stays in history forever
- **Item deletion:** Super Admin can permanently delete
- **Inter-branch transfer:** Super Admin initiates + both managers approve
- **'Book This Item' button:** Shows availability calendar first → then starts booking flow
- **Availability calendar:** Gantt bars on item detail page
- **Item profitability:** Revenue – purchase cost – washing – repair = net profit
- **Low stock alerts:** Below configurable threshold
- **Misplaced item:** Staff manually marks as misplaced
- **Customer wishlist:** Staff adds items, notify customer when available
- **QR label content:** QR code + barcode on same label + storage location + SKU + care icons
- **Bulk QR print:** Select multiple → print all in one job
- **No max wash count tracking (removed)**
- **No seasonal pricing**
- **No supplier tracking per item**
- **No AI description generator**
- **No insurance tracking**
- **No photo quality check**
- **Notion sync:** Every new item + every status change pushed to Notion inventory DB
- **Inventory settings:** Editable by manager per branch (SKU format, buffer days, low stock threshold, depreciation)

### Booking Step 2 — Item Selection Detail
- Item card shows: photo + name + SKU + sizes + exact stock count per size (e.g. M: 3 available)
- All sizes shown; unavailable sizes greyed out with exact count
- Size buttons (S/M/L/XL) — quantity +/- per size
- Max quantity = actual available stock (hard limit, cannot exceed)
- Selected items: summary bar at bottom of screen
- Tap X on item card to remove from cart
- Single price for all sizes

---

## 9. Section 4: Customers

### Customer List
- **Default layout:** List view with search + filters + status tabs
- **Filters:** Tier / Risk score / Blacklist status / Last booking date / Total spend range / Gender/age group
- **Card shows:** Customer name + phone + tier badge + risk badge + last booking date
- **Tap card:** Opens full customer detail page
- **Search:** Name / phone / Aadhaar last 4 / email
- **Duplicate detection:** Alert if phone already exists

### Customer Detail Page
**Tabs:** Overview / Bookings / Measurements / Payments / Documents / Notes / Communication

**Overview tab:**
- Total bookings / total spend / avg booking value / loyalty tier
- Contact info
- Risk badge: Low (green) / Medium (yellow) / High (red)
- VIP flag (manual toggle by manager — unlocks perks like deposit skip)
- Family group membership + loyalty point pooling info

**Bookings tab:**
- Full booking history + outfit history as visual grid (item photos + occasion + date)

**Measurements tab:** (Tab exists but no measurement tracking — empty)

**Payments tab:**
- All transactions + store credit + debt tracking

**Documents tab:**
- Aadhaar front + back photos (viewable by all staff, stored permanently, no auto-deletion)

**Notes tab:**
- Any staff can add; only manager can view
- One pinned note at top (visible to all staff)

**Communication tab:**
- WhatsApp log: only in Notifications section (not here)
- Activity timeline: all interactions (bookings/payments/notes) chronological

### Customer Features
- **Minimum fields:** Name + phone (both mandatory)
- **Tier upgrade:** Auto based on cumulative spend thresholds (configurable)
- **Risk score:** Auto-calculated (late returns + damage + cancellations + disputes) → Low/Medium/High badge
- **Blacklist levels:**
  - Level 1 = warning tag (branch-specific)
  - Level 2 = manager override required (branch-specific)
  - Level 3 = hard block (franchise-wide)
  - Manager only can blacklist
- **No measurement tracking**
- **No occasion calendar**
- **No store credit feature**
- **Debt tracking:** Outstanding balance owed by customer (unpaid penalties/charges)
- **Loyalty points ledger:** Every earn + redeem + expire entry with date + reason
- **No referral code system**
- **Customer data export:** Individual + bulk both available
- **Aadhaar access:** All staff can view, stored permanently
- **Pinned note:** One pinned note at top (visible to all staff)
- **WhatsApp log:** Only in Notifications section
- **VIP flag:** Manual toggle by manager (unlocks perks like deposit skip)
- **Customer groups:** VIP / Bridal / Regular / Lapsed / Custom (for WhatsApp campaign targeting)
- **Outfit history:** Visual grid (item photos + occasion + date) in Bookings tab
- **Activity timeline:** All interactions chronological
- **Duplicate merge:** Super Admin approval required
- **Customer deletion:** Super Admin can permanently delete
- **Customer stats:** Total bookings / total spend / avg booking value / loyalty tier on overview
- **Family group:** Link members + pool loyalty points (optional)
- **No birthday automation**
- **No re-engagement automation**
- **Customer settings:** Editable by manager per branch

---

## 10. Section 5: Washing Queue

### Queue Layout
- **Default view:** List view with stage tabs: Queue / Washing / Drying / Ironing / QC / Ready
- **Priority order:** Urgent → High → Normal → Low (auto-sorted)
- **URGENT auto-flag:** Item has booking starting within 24 hours
- **SLA countdown:** Shown only for URGENT items
- **Real-time:** Via Supabase Realtime subscription

### Item Card Shows
Name + SKU + category + next booking date + priority badge + stage

### Queue Entry
- Auto-added on return scan + manual add by staff (default = manual; auto-add toggle exists in Settings)

### Stage Updates
- Both: QR scan or manual select from list
- Bulk stage update: select multiple → move all to next stage at once
- Remove from queue: Manager only

### Staff Assignment
- Staff self-assigns by tapping "Take this item"

### Washing Features
- **Batching:** Optional — staff decides
- **SLA:** Configurable per category (hours to completion)
- **SLA breach:** Manager in-app alert + staff reminder
- **External vendor:** Log items sent + handover date + expected return + vendor cost
- **Overdue vendor alert:** Manager alert when not returned by expected date
- **Washing cost:** Entered manually per item → linked to expenses section automatically
- **Washing notes:** Per item (e.g. "stain on sleeve, pre-treat")
- **Item auto-returns:** To Available status once marked Ready
- **Washing history:** All wash entries (date + staff + cost) — auto-pushed to Notion monthly
- **No care instructions popup**
- **No washing photos**
- **No quality rating**
- **No machine tracking**
- **No chemicals tracking**
- **No washing queue export**
- **No washing analytics on washing page** (analytics only in main analytics section)
- **Max wash count:** REMOVED — not tracked
- **Washing settings:** Super Admin only (SLA per category, auto-add toggle, cost formula)

### Search & Filters
- **Search:** Item name / SKU / booking ID / customer name
- **Filter:** Category / priority / stage / assigned staff
- **Sort:** Priority / next booking date / time entered queue

---

## 11. Section 6: Payments & Finance

### Access
- Dedicated Payments section in sidebar only
- Accessible by all staff (any staff can view + add expenses)

### Payment Methods
- Cash
- UPI (GPay/PhonePe/Paytm)
- Bank Transfer / NEFT / IMPS
- Store Credit (manager approval required)
- (No Cheque)

### Payments Home Page
- Daily revenue summary: total collected today by method
- Outstanding balance: shown on dashboard + payments section
- Deposit liability: shown on dashboard + payments section
- Transaction list: all transactions with booking ID + type + amount + method + staff + timestamp

### Reconciliation
- Daily cash reconciliation: staff count vs system records + manager approves discrepancy

### Reports
- Payment method breakdown: analytics section only
- Overdue penalty: inside each booking only
- P&L: analytics section only
- Royalty: Super Admin only (auto-calculated monthly as configurable % of branch revenue)
- No commission tracking

### Receipts & Export
- Payment receipt: thermal print + PDF option
- Payment export: PDF only
- Payment void log: all voided transactions with reason + staff + timestamp
- Advance payment tracking: shows advance paid vs balance remaining per booking

### Settings
- Payment settings: Super Admin only

---

## 12. Section 7: Staff & HR

### Staff List
- Manager can: add/remove/role change + inventory + bookings
- Staff card: Name + role badge + status (online/offline) + last login + clock-in status

### Staff Detail Page
**Tabs:** Profile / Attendance / Performance / Documents / Payroll

### Attendance
- GPS clock-in: must be within X metres of store (configurable)
- No shift scheduling — staff just clock in when they arrive
- Attendance report: only inside each staff profile (no export)

### Performance
- Monthly revenue target + booking count target per staff
- Performance report: revenue + bookings per staff per month (manager only)
- No leaderboard

### Documents
- Staff documents stored (Aadhaar/PAN/contract) — no expiry tracking

### Other Staff Features
- Payroll: not in system (handled externally)
- Handover system: none (verbal only)
- Password reset: staff resets own via forgot password link
- Daily opening checklist: manager configures per branch → staff completes on login → flagged if incomplete after 30 min
- Staff can be added/removed/role-changed by manager
- No daily briefing system

---

## 13. Section 8: Analytics

### Access
- Dedicated Analytics section in sidebar
- Visible to manager + Super Admin only
- Exportable as PDF + Excel (all reports)

### Default Date Range
- This month (can switch to last 7 days / 30 days / custom range)

### Reports Available
1. Revenue over time (daily/weekly/monthly)
2. Booking count + conversion rate
3. Item utilisation rate per item
4. Staff performance (revenue per staff)
5. Customer acquisition + retention
6. Washing cost vs revenue (P&L)

### NPS
- Collected in-app by staff (staff asks customer to rate before leaving)

### Super Admin Revenue Dashboard
- MRR + total clients + active vs churned + plan breakdown

---

## 14. Section 9: Calendar

### View
- Gantt chart: all items as availability bars by date
- View modes: Day / Week / Month toggle
- Filter: By item category / booking status / staff
- Accessible by all staff

### Interactions
- Tap a booking → opens booking detail slide-over
- Calendar is read-only (no booking creation from calendar)

---

## 15. Section 10: Settings

### Structure
- Settings: different tabs visible based on role
- Sections: Branch settings / Print settings / Roles & permissions / Integrations / Billing

### Branch Settings (Manager per branch)
- Store name + logo + address + GST number + contact + opening hours

### Print Settings (Manager per branch)
- Receipt header/footer/logo + font size + QR position + store info (fully customisable)
- Printer: Vyapar VYPRTP3001 (3-inch/68mm thermal)

### Roles & Permissions (Super Admin only)
- Custom roles with specific permission sets
- Fixed roles: Super Admin / Manager / Floor Staff / Auditor

### Integrations (Super Admin)
- Notion API
- WhatsApp Business API
- Google OAuth

### Billing (Super Admin)
- Plan + amount + due date + paid/unpaid status per business

---

## 16. Section 11: Expenses

### Access
- Any staff can view + add expenses

### What is Tracked
- Daily expenses: rent / salaries / utilities / repairs / misc
- Fields: category + amount + receipt photo
- Washing costs auto-linked to expenses section

### Export
- Auto-pushed to Notion monthly

---

## 17. Section 12: Franchise

### Access
- Super Admin only

### Franchise Section Contains
- All branches overview
- Revenue comparison (live, side-by-side)
- Royalty tracking (auto-calculated monthly as configurable % of branch revenue)
- Inter-branch item transfers

### Branch Data Isolation
- RLS per branch
- Super Admin can see all branches
- Branch managers can only see their own branch

---

## 18. Section 13: Security & Audit

### Audit Trail
- Full audit trail: every action logged with user + timestamp + old value + new value
- Append-only (cannot be edited or deleted)
- Visible to Super Admin only

### Session Management
- Sessions expire after X hours of inactivity (configurable)
- PIN required for logout confirmation
- PIN lock icon in top bar (manual lock)

### Login Approval
- New staff Google login requires manager approval before access granted
- Google OAuth does NOT bypass approval

### RLS
- Row-level security on all Supabase tables
- Isolation per branch + per business

---

## 19. Section 14: Notifications & WhatsApp

### In-App Notifications
- Bell icon → inbox with all alerts
- Approve/reject inline from inbox
- Sound + badge on bell for new notifications
- Sound + vibration on mobile

### WhatsApp
- All WhatsApp messages sent MANUALLY by staff (no automated sends)
- WhatsApp templates configurable in Settings (one per trigger type — editable by manager per branch)
- WhatsApp log: all messages stored in Notifications section, searchable by customer/booking
- WhatsApp log NOT shown on customer profile or booking detail (only in Notifications section)

### Push Notifications
- In-app push notifications on mobile browser (PWA) for: new booking / overdue / approval pending

---

## 20. Section 15: Landing Page & Plans

### Landing Page
- **Built with:** Next.js (same repo)
- **Language:** English only
- **Sections:** Hero + Features + How it works + Pricing + Testimonials + Contact
- **Contact:** Email link (mailto) only
- **Demo:** Live demo booking option (book a call)
- **Pricing:** Basic / Pro / Enterprise plans shown

### Business Onboarding (Super Admin creates accounts)
- No public self-signup — Super Admin (Ansil) manually creates each new business account
- Landing page = marketing only
- Super Admin creates: name + owner + subdomain + plan → sends setup wizard link to owner
- New business owner sets own password + completes setup wizard
- Setup wizard: branch details → invite staff → add first items → test booking → go live
- Onboarding support: WhatsApp support from Echo team (Ansil)

### Plans
- **Basic:** 1 branch + limited items + limited staff
- **Pro:** 3 branches + more features
- **Enterprise:** Unlimited branches + unlimited everything
- **Trial:** 14 days free on any plan
- **Plan changes:** Super Admin only
- **Payment overdue:** Super Admin manually suspends (no auto-suspension)
- **Billing tracked:** Plan + amount + due date + paid/unpaid per business

### Super Admin Panel
- Total businesses / active / pending / rejected
- Usage stats + billing status per business
- Impersonation: Super Admin can view as any business (read-only)
- Full control: suspend / reactivate / delete / change plan
- MRR + total clients + active vs churned + plan breakdown

### Subdomains
- Each business: businessname.echo.app via Vercel subdomain routing

---

## 21. Section 16: Data Sync & Offline

### Sync Strategy
- Supabase Realtime for ALL data (bookings + inventory + washing + payments + notifications)

### What Syncs in Real-Time
- Booking status changes → instant sync all devices
- Inventory availability → item removed from available instantly
- Washing queue updates → badge drops instantly
- Payment recorded → revenue counter updates instantly on all dashboards

### Offline
- Read-only offline (can view but not act)
- Yellow offline banner at top

### Notion Sync
- Bookings: Notion page auto-created on every new booking
- P&L: pushed automatically
- Inventory changes: every new item + every status change
- Washing history: auto-pushed monthly
- Expenses: auto-pushed monthly
- Method: webhook on event (Edge Function)

### Conflict Resolution
- First-write-wins (first staff action takes priority)

### Failed Sync
- Supabase handles natively

---

## 22. Section 17: Database & Infrastructure

### Database
- Supabase PostgreSQL with RLS per branch + row-level isolation per business
- Single Supabase project with RLS (not separate schemas per business)

### Authentication
- Google OAuth with approval flow
- Google login does NOT bypass manager approval
- New staff must be approved by manager before access

### File Storage
- Separate Supabase Storage buckets per file type:
  - Photos bucket (item photos)
  - Documents bucket (Aadhaar, staff docs)
  - Receipts bucket

### Edge Functions
- Notion sync
- WhatsApp Business API
- Cron jobs: overdue status calculation (midnight) + royalty calculation (monthly)

### Deployment
- Frontend: Vercel (Next.js App Router)
- Backend: Supabase Cloud (ap-south-1 Mumbai)
- Subdomains: businessname.echo.app via Vercel

### QR Codes & Barcodes
- Booking receipt QR: api.qrserver.com (free, no key needed)
- Item label barcode: barcodeapi.org (free, no key needed)

---

## 23. Section 18: Sprint Roadmap

### Phase 1 — Foundation (Weeks 1–6)
- Auth (Google OAuth + approval flow)
- Dashboard (role-based, real-time)
- Inventory (items, variants, QR labels)
- Customers (profiles, tiers, blacklist)

### Phase 2 — Core Operations (Weeks 7–14)
- Bookings (6-step flow, pickup, return, draft, QR scan)
- Washing Queue (stages, SLA, vendor)
- Payments (reconciliation, receipts, deposit tracking)
- Staff (attendance GPS, performance targets, documents)

### Phase 3 — Scale (Weeks 15–24)
- Franchise (multi-branch, royalty, transfers)
- Analytics (all reports, exports)
- Settings (print, roles, integrations)
- Security & Audit (full audit trail, session management)

### Sprint 1 Focus (Weeks 1–4)
- Database schema design
- Auth with Google OAuth + approval flow
- Core data models (businesses, branches, staff, items, bookings, customers)

---

## Appendix: Key Locked Decisions Summary

| Decision | Answer |
|----------|--------|
| No AI features | Confirmed — all AI removed |
| No coupon system | Discount via price override only |
| No seasonal pricing | Staff adjusts manually |
| No measurement tracking | Tab exists but empty |
| No store credit | Removed |
| No referral codes | Removed |
| No birthday/re-engagement automation | Removed |
| No digital customer signature | Physical receipt only |
| No max wash count | Removed |
| No photo quality check | Removed |
| No WhatsApp auto-send | Manual only |
| No SMS fallback | WhatsApp only |
| No PDF export for booking detail | Thermal receipt only |
| No leaderboard | Individual profiles only |
| No payroll | External system |
| No handover system | Verbal only |
| QR scan at pickup | Opens booking + staff taps "Start Pickup" |
| Aadhaar upload | Pickup time only |
| Draft expiry | No expiry |
| Price override | Replaces original (original not shown) |
| ID/Aadhaar stored permanently | No auto-deletion |

---

*Echo PRD v1.0 — Confidential — Owner: Ansil*