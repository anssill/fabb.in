import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/load-source.mjs'

test('item code edits persist, normalize, clear, and leave omitted codes unchanged', async () => {
  const item = { id: 'item', name: 'Shirt', sku: 'OLD', tracking_mode: 'quantity' }
  const audits = [], paths = []
  const variants = [{ id: 'size', size: 'M', total_stock: 1 }]
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'staff' } } }) },
    from(table) {
      let changes
      const query = {
        select() { return query }, eq() { return query }, is() { return query },
        update(value) { changes = value; return query },
        insert(value) { if (table === 'audit_log') audits.push(value); return query },
        single: async () => ({ data: table === 'staff' ? { business_id: 'biz', branch_id: 'branch', role: 'owner' } : { ...item } }),
        then(resolve, reject) {
          if (table === 'items' && changes) Object.assign(item, changes)
          return Promise.resolve({ data: table === 'item_variants' ? variants : null, error: null }).then(resolve, reject)
        },
      }
      return query
    },
  }
  const { updateItem } = loadSource('src/app/(dashboard)/inventory/inventory-actions.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    'next/cache': { revalidatePath: path => paths.push(path) },
  })
  const form = { name: 'Shirt', category: 'Suits', price: 100 }
  await updateItem('item', { ...form, sku: ' new-123 ' }, variants)
  assert.equal(item.sku, 'NEW-123')
  assert.equal(audits[0].old_value.sku, 'OLD')
  assert.equal(audits[0].new_value.sku, 'NEW-123')
  assert.ok(paths.includes('/inventory/item'))
  await updateItem('item', form, variants)
  assert.equal(item.sku, 'NEW-123')
  await updateItem('item', { ...form, sku: '  ' }, variants)
  assert.equal(item.sku, null)
})
