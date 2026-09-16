import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
export async function createTestDatabase() {
  const db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb,raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
    grant usage on schema public,auth,storage to authenticated; grant select,insert,update,delete on storage.objects to authenticated;`)
  const files = fs.readdirSync('supabase/migrations').filter(name => name.endsWith('.sql') && !name.includes('push_cron')).sort()
  for (const name of files) await db.exec(fs.readFileSync('supabase/migrations/' + name, 'utf8').replace(/create extension if not exists pgcrypto;/g, ''))
  return db
}
