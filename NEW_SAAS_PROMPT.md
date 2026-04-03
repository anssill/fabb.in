# ████████████████████████████████████████████████████████████
# [PROJECT_NAME] — GODMODE PROMPT v1.0
# THE SINGLE MOST COMPLETE SAAS PROMPT EVER WRITTEN
# EVERY FEATURE. EVERY SCREEN. EVERY BUTTON. EVERY FIELD.
# EVERY RULE. EVERY API. EVERY COMPONENT. EVERY EDGE CASE.
# Save as CLAUDE.md in the root directory — auto-loaded every session
# Owner: [YOUR_NAME/COMPANY] | [ONE-LINE SAAS DESCRIPTION]
# ████████████████████████████████████████████████████████████

---

# ══════════════════════════════════════════════════════════════
# SECTION 1: PRODUCT IDENTITY + HOW THE SAAS WORKS
# ══════════════════════════════════════════════════════════════

## What [PROJECT_NAME] Is
[PROJECT_NAME] is a [B2B/B2C] SaaS that does [CORE VALUE PROPOSITION].
It replaces [EXISTING FRUSTRATING TOOLS] for [TARGET AUDIENCE].

## Core Entities / Resources
Resource 1: [e.g., Projects / Workspaces]
Resource 2: [e.g., Tasks / Invoices / Clients]
Resource 3: [e.g., Categories / Tags]

## How Multi-Tenancy / Organization Works
- Single [Database Type] project, shared database.
- Data isolated by [tenant_id / org_id / workspace_id].
- Strict Row Level Security (RLS) on all user-data tables.
- Subdomain routing (optional): [orgname].yourdomain.com = isolated org data.

## User Types
TYPE 1 — [e.g., Owner / Admin]:
  Permissions: Full billing, add/remove members, delete workspace.
TYPE 2 — [e.g., Member / Staff]:
  Permissions: Can edit resources, cannot change billing.
TYPE 3 — [e.g., Viewer / Guest]:
  Permissions: Read-only access to assigned projects.

## Auth Flow (Every Request)
  Every route → [Middleware Mechanism] runs →
  Not authenticated? → /login
  Missing permissions? → /unauthorized
  Otherwise → serve page

---

# ══════════════════════════════════════════════════════════════
# SECTION 2: ABSOLUTE RULES — NEVER VIOLATE
# ══════════════════════════════════════════════════════════════

1.  TypeScript strict mode — zero `any`, zero @ts-ignore
2.  RLS on every database table — no exceptions ever
3.  Mobile-first layouts — test on 375px screens first
4.  Skeleton loading only — avoid generic spinners.
5.  [ADD YOUR SPECIFIC RULE] - e.g., "All monetary values must be stored in cents."
6.  [ADD YOUR SPECIFIC RULE] - e.g., "No AI features in the product."
7.  Check codebase before writing — never rebuild existing logic.
8.  npm run build after every module — zero errors.

---

# ══════════════════════════════════════════════════════════════
# SECTION 3: COMPLETE TECH STACK
# ══════════════════════════════════════════════════════════════

## Install All Dependencies
[Adjust these to your preference]
npm install next@14 react react-dom typescript
npm install tailwindcss postcss autoprefixer
npm install [Backend SDK e.g., @supabase/supabase-js, firebase]
npm install next-themes zustand
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react sonner
npx shadcn-ui@latest init

## Framework Decisions
Frontend: Next.js App Router (SSR, Server Components)
Styling: TailwindCSS + shadcn/ui
State Management: Zustand (global UI) + TanStack Query (server state)
Forms: React Hook Form + Zod validation
Icons: Lucide React
Toasts: Sonner

## Backend Infrastructure
Database: [Supabase Postgres / Firebase Firestore / MongoDB]
Authentication: [Supabase Auth / Clerk / NextAuth]
Storage: [Supabase Storage / AWS S3]
Cloud Functions: [Vercel Edge / Supabase Edge Functions / AWS Lambda]

## Deployment
Hosting: [Vercel / Netlify / AWS]
CI/CD: GitHub Actions (linting, type-check, playwright tests)

---

# ══════════════════════════════════════════════════════════════
# SECTION 4: DESIGN SYSTEM
# ══════════════════════════════════════════════════════════════

## Font
[e.g., Inter / Poppins] from next/font/google
Weights: 400, 500, 600, 700

## Color Tokens
Primary: [e.g., #3b82f6 (blue-500)]
Dark theme:
  --bg: #09090b
  --card: #18181b
  --text: #fafafa
Light theme:
  --bg: #f4f4f5
  --card: #ffffff
  --text: #09090b

Status colors:
  Success: #22c55e (green)
  Info: #3b82f6 (blue)
  Warning: #f59e0b (amber)
  Error: #ef4444 (red)

## Layout & Animation Specs
Sidebar: fixed left, 260px expanded / 64px collapsed
TopBar: fixed top, h-16
Mobile: Sidebar hidden, hamburger opens drawer
Modal Animation: scale 0.95→1, opacity 0→1, 200ms
Page Transition: simple fade in.

---

# ══════════════════════════════════════════════════════════════
# SECTION 5: EXTERNAL APIs + INTEGRATIONS
# ══════════════════════════════════════════════════════════════

## API 1: AUTHENTICATION ([Provider])
[Provide specific setup details, environment variables, and code snippet for sign in/sign out]

## API 2: DATABASE ([Provider])
[Provide specific rules on how data should be fetched, e.g., ORM usage, raw SQL, or API client]

## API 3: PAYMENTS (Stripe / LemonSqueezy)
[Setup webhooks, subscription logic, pricing tiers]

## API 4: EMAIL (Resend / SendGrid)
[Define email templates, trigger events (signup, reset password)]
