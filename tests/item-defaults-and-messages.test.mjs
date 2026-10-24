import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/load-source.mjs'

test('category presets only offer relevant sizes and keep custom categories usable', () => {
  const { categorySizePresets } = loadSource('src/app/(dashboard)/inventory/components/SizePicker.tsx')
  assert.deepEqual(Object.keys(categorySizePresets('Loafers')), ['Shoes (UK / India)', 'Shoes (EU)'])
  assert.deepEqual(Object.keys(categorySizePresets('Suits')), ['Clothing', 'Numeric / waist'])
  assert.deepEqual(categorySizePresets('Jewellery'), { 'One size': ['Free Size'] })
  assert.ok(categorySizePresets('Kids wear')['Kids (years)'])
  assert.ok(categorySizePresets('Custom garment').Clothing)
})

test('saved WhatsApp templates use actual status, payments and literal customer values', () => {
  const { buildInvoice, invoiceMessage, bookingStatusMessage } = loadSource('src/lib/invoice.ts')
  const invoice = buildInvoice({ booking_number: 'BK-7', status: 'picked_up', customer: { name: '{status} $&' }, total_amount: 1000,
    booking_payments: [{ type: 'advance', amount: 200 }, { type: 'balance', amount: 900, is_voided: true }],
  }, { name: 'Fabb' }, { settings: { invoice: {
    whatsapp_invoice_template: 'Hello {customer_name}: {invoice_number} / {paid} / {balance}',
    whatsapp_status_template: '{booking_number}: {status} at {business_name}',
  } } })
  assert.equal(invoiceMessage(invoice), 'Hello {status} $&: INV-BK-7 / ₹200 / ₹800')
  assert.equal(bookingStatusMessage(invoice), 'BK-7: picked up at Fabb')
  invoice.settings.whatsapp_invoice_template = ''
  assert.equal(invoiceMessage(invoice), '')
})

test('SKU suggestions honor saved prefixes, archived numbers, and retry concurrent conflicts', async () => {
  const items = [{ sku: 'LF-002' }, { sku: 'LF-010' }, { sku: 'LF-AB12' }, { sku: 'SHO-099' }]
  let calls = 0
  const submissions = []
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'staff' } } }) },
    from(table) {
      const query = {
        select() { return query }, eq() { return query }, order() { return query },
        range: async () => ({ data: items, error: null }),
        single: async () => ({ data: table === 'staff' ? { business_id: 'biz', branch_id: 'branch', role: 'owner' } : { settings: { categories: [{ name: 'Loafers', prefix: 'LF' }] } }, error: null }),
      }
      return query
    },
    async rpc(_name, args) {
      submissions.push(args.p_item)
      if (calls++ === 0) { items.push({ sku: args.p_item.sku }); return { error: { code: '23505' } } }
      return { data: 'created', error: null }
    },
  }
  const { suggestItemSku, createItem } = loadSource('src/app/(dashboard)/inventory/inventory-actions.ts', {
    '@/lib/supabase/server': { createClient: async () => db }, 'next/cache': { revalidatePath() {} },
  })
  assert.equal(await suggestItemSku('Loafers'), 'LF-011')
  assert.equal((await createItem({ name: 'Loafer', category: 'Loafers', price: 100, auto_sku: true }, [{ size: '8', total_stock: 1 }])).id, 'created')
  assert.deepEqual(submissions.map(item => item.sku), ['LF-011', 'LF-012'])
  assert.equal(submissions[0].auto_sku, undefined)
})

test('configured prefixes override old codes and matching sequences preserve padding', () => {
  const { nextInventorySku } = loadSource('src/lib/inventory-sku.ts')
  const items = [
    { sku: 'FBCL01', category: 'Loafers' }, { sku: 'fbcl06', category: 'Loafers' },
    { sku: 'FBCK01', category: 'Kurtha' }, { sku: 'FBCL08', category: 'Accessories' },
  ]
  assert.equal(nextInventorySku(items, 'Loafers', 'LOA'), 'LOA-001')
  assert.equal(nextInventorySku(items, 'Kurtha', 'KUR'), 'KUR-001')
  assert.equal(nextInventorySku(items, 'Loafers', 'FBCL'), 'FBCL09')
  assert.equal(nextInventorySku([...items, { sku: 'LOA-012', category: 'Accessories' }], 'Loafers', 'LOA'), 'LOA-013')
  assert.equal(nextInventorySku([{ sku: 'LOA-009', category: 'Loafers' }], 'Loafers', 'LOA'), 'LOA-010')
  assert.equal(nextInventorySku([], 'Shoes', 'SHO'), 'SHO-001')
  assert.equal(nextInventorySku([{ sku: 'LF-99999999999999999999', category: 'Loafers' }], 'Loafers', 'LF'), 'LF-100000000000000000000')
})
