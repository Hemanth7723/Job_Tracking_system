# Supabase Migration Instructions

To migrate your backend to Supabase, follow these steps:

## 1. Setup Database
1. Go to your Supabase Project -> **SQL Editor**.
2. Copy the contents of `supabase_schema.sql` and run it. This will:
   - Create the `jobs` table.
   - Enable Row Level Security (RLS).
   - Create access policies.
   - Setup the `resumes` storage bucket.

## 2. Environment Variables
You need to set the following environment variables in your hosting service (Railway/Vercel/etc.):
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key.

## 3. Data Export (Optional)
Since your Railway instance is expired, if you have access to your `pb_data/data.db` file:
1. Export the `jobs` table from SQLite to CSV.
2. Go to Supabase -> **Table Editor** -> `jobs` table.
3. Use the **Import** feature to upload your CSV data.
4. Note: You will need to map the `user` field to the new UUIDs in Supabase's `auth.users` table.

## 4. DB Secret
You mentioned having `SUPABSE_DB_SECRET` in GitHub secrets. Since this is a frontend-heavy (SPA) application using the Supabase Client SDK, the connection is handled via the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The DB secret itself is usually used for direct Postgres connections (e.g., via Prisma or Drizzle in a Node backend). If you eventually add a Node backend, you can use that secret there.
