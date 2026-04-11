# Fabb.booking 👗

**Fabb.booking** is a premium, full-stack rental management system designed for boutique apparel and designer wear businesses. It streamlines the lifecycle of garment rentals—from inventory management and booking to washing and final returns.

## ✨ Key Features

### 🏢 Multi-Branch Management
- Centralized control for multiple retail locations.
- Branch-specific inventory, staff, and pricing rules.
- Real-time stock synchronization across branches.

### 📅 Advanced Booking Engine
- Step-by-step booking flow (Customer -> Items -> Dates -> Payments).
- Automatic rental price calculation based on duration.
- Conflict prevention for inventory scheduling.

### 🧼 Washing & Maintenance Workflow
- Track items currently "In Washing" or "In Fitting".
- Transition items back to live inventory with a single click.
- Condition tracking (Excellent, Good, Fair, Maintenance).

### 💳 Payments & Analytics
- Multi-mode payment tracking (UPI, Cash, Bank Transfer).
- Advanced analytics for revenue, bookings, and top customers.
- Exportable expense logs and branch-wise performance metrics.

### 🔔 Notifications & Third-Party Integrations
- Internal staff alerts for overdue returns and low stock.
- Automated customer SMS confirmations via **MSG91**.
- **Marketplace Hub**: Modular support for external public APIs.
- **Dynamic Weather**: Real-time conditions for rental branches.
- **Smart Validation**: Instant phone and email verification.

---

## 🛠️ Technical Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: [Supabase (PostgreSQL)](https://supabase.com/)
- **Auth**: Supabase Auth (OTP & Password)
- **State Management**: Zustand
- **Components**: Radix UI (Shadcn UI)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.x or later.
- A Supabase project.
- (Optional) MSG91 account for SMS.

### 2. Environment Setup
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env.local
```

### 3. Installation & Database
Install dependencies and initialize the database via Supabase:
```bash
npm install
# Run your migrations in the Supabase SQL editor using the provided .sql files in /supabase/migrations
```

### 4. Running the App
```bash
npm run dev
```

---

## 📂 Project Structure
- `/src/app/(dashboard)`: Main application modules (Bookings, Inventory, etc.).
- `/src/app/(auth)`: Authentication flows.
- `/src/lib`: Shared utilities, API wrappers (MSG91, Stripe), and state stores.
- `/src/components/ui`: Reusable UI primitives.

## 📄 License
Internal Proprietary Software - (c) 2026 Fabb.booking Team
