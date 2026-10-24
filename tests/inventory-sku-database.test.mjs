import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

test('database rejects repeated SKU inserts and edits within a business, including archived codes', async t => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`create role anon; create role authenticated;
    create table public.items(id uuid primary key default gen_random_uuid(), business_id uuid not null, sku text, archived_at timestamptz);`)
  await db.exec(fs.readFileSync('supabase/migrations/20261005113631_prevent_repeated_inventory_skus.sql', 'utf8'))
  const biz = '11111111-1111-4111-8111-111111111111'
  const other = '22222222-2222-4222-8222-222222222222'
  await db.query('insert into items(business_id,sku,archived_at) values($1,$2,now())', [biz, 'FBCL06'])
  await assert.rejects(db.query('insert into items(business_id,sku) values($1,$2)', [biz, ' fbcl06 ']), error => error.code === '23505')
  const { rows } = await db.query('insert into items(business_id,sku) values($1,$2) returning id,sku', [biz, ' fbcl07 '])
  assert.equal(rows[0].sku, 'FBCL07')
  await assert.rejects(db.query('update items set sku=$1 where id=$2', ['FBCL06', rows[0].id]), error => error.code === '23505')
  await db.query('update items set sku=sku where id=$1', [rows[0].id])
  await db.query('insert into items(business_id,sku) values($1,$2)', [other, 'FBCL06'])
  await db.query('insert into items(business_id,sku) values($1,null),($1,null)', [biz])
})
