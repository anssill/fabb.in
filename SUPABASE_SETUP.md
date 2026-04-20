# 🚀 Supabase Setup Guide

Follow these steps to configure your Supabase project for **Google-Only Authentication** and **Multi-tenant Business Creation**.

## 1. Database Initialization

Before the application can work, you must apply the foundational schema.

1.  Go to your **Supabase Dashboard** -> **SQL Editor**.
2.  Create a **New Query**.
3.  Copy and paste the contents of the following files (in order) and click **Run**:
    - `00001_initial_schema.sql`
    - `00002_agent1_schema.sql`
    - `00002_bookings_module.sql`
    - `00002_inventory_washing_schema.sql`

---

## 2. Configure Google OAuth

The app strictly uses Google for login. You must enable it in Supabase.

1.  Go to **Authentication** -> **Providers**.
2.  Select **Google**.
3.  Toggle **Enable Google Provider** to ON.
4.  You will need a **Client ID** and **Client Secret** from the [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project.
    - Go to **APIs & Services** -> **Credentials**.
    - Create an **OAuth 2.0 Client ID** (Web Application).
    - Add the **Authorized redirect URI** provided by Supabase (it looks like `https://xyz.supabase.co/auth/v1/callback`).
5.  Paste the Client ID/Secret into the Supabase Google Provider settings and click **Save**.

---

## 3. Environment Variables

Ensure your local `.env.local` or production environment has these keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 4. Auth Redirection Settings

1.  Go to **Authentication** -> **URL Configuration**.
2.  Set the **Site URL** to your production URL (or `http://localhost:3000` for development).
3.  Add `http://localhost:3000/auth/callback` to the **Redirect URLs** list.

---

## 5. Deployment Checklist

- [x] RLS enabled on all tables.
- [ ] Google Auth working.
- [ ] New login redirects to `/setup-wizard`.
- [ ] Business/Branch creation updates the `staff` table.

> [!IMPORTANT]
> The creator of a business is automatically marked as `owner` and `status: approved` in the `staff` table, granting them immediate dashboard access.
