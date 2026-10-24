import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createTestDatabase } from './helpers/database.mjs'
import { loadSource } from './helpers/load-source.mjs'

test('booking number validation and normalization', () => {
  const { bookingNumberError, normalizeBookingNumber } = loadSource('src/lib/booking-number.ts')
  for (const value of [undefined, '', '   ', 'fabb-1001', ' shop/26_001 ', 'A'.repeat(40)]) assert.equal(bookingNumberError(value), null)
  for (const value of ['A'.repeat(41), 'a b', '<script>', 'bill.1', 'नंबर']) assert.ok(bookingNumberError(value))
  assert.equal(normalizeBookingNumber(' fabb/26_001 '), 'FABB/26_001')
})

test('booking action passes the normalized custom number and preserves RPC errors', async () => {
  let payload
  let rpcError = null
  const { createNewBookingFlow } = loadSource('src/app/(dashboard)/bookings/new/booking-actions.ts', {
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'staff' } } }) },
      rpc: async (name, input) => { payload = input.p_input; return { data: { booking_id: 'uuid', booking_number: 'FABB/1' }, error: rpcError } },
    }) },
    'next/cache': { revalidatePath() {} },
  })
  const customer = { name: 'Customer', phone: '9999999999' }
  const result = await createNewBookingFlow({ customer, customBookingNumber: ' fabb/1 ', requestId: 'same-request' })
  assert.equal(payload.customBookingNumber, 'FABB/1')
  assert.equal(payload.requestId, 'same-request')
  assert.equal(result.bookingId, 'uuid')
  assert.equal(result.bookingNumber, 'FABB/1')
  rpcError = { message: 'This booking number is already in use.' }
  assert.match((await createNewBookingFlow({ customer, customBookingNumber: 'FABB/1' })).error, /already in use/)
  assert.equal((await createNewBookingFlow({ customBookingNumber: 'bad number' })).success, false)
})

test('booking numbering database contract', async t => {
  const db = await createTestDatabase()
  t.after(() => db.close())
  const owner = randomUUID(), staff = randomUUID(), biz = randomUUID(), branch = randomUUID(), branch2 = randomUUID(), customer = randomUUID()
  const item = randomUUID(), item2 = randomUUID(), variant = randomUUID(), variant2 = randomUUID()
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)', [owner, 'numbers-owner@test.invalid', staff, 'numbers-staff@test.invalid'])
  await db.query("insert into businesses(id,name,slug,owner_id) values ($1,'Number test','number-test',$2)", [biz, owner])
  await db.query("insert into branches(id,business_id,name,prefix) values ($1,$2,'One','ONE'),($3,$2,'Two','TWO')", [branch, biz, branch2])
  await db.query("insert into staff(id,business_id,branch_id,email,role,permissions) values ($1,$2,$3,'numbers-owner@test.invalid','owner','{}'),($4,$2,$3,'numbers-staff@test.invalid','staff','{\"manage_bookings\":true}')", [owner, biz, branch, staff])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
  await db.query("insert into customers(id,business_id,branch_id,name,phone) values ($1,$2,$3,'Test customer','9999999999')", [customer, biz, branch])
  for (const [location, product, size] of [[branch, item, variant], [branch2, item2, variant2]]) {
    await db.query("insert into items(id,business_id,branch_id,name,category) values ($1,$2,$3,'Shirt','test')", [product, biz, location])
    await db.query("insert into item_variants(id,item_id,business_id,branch_id,size,total_stock) values ($1,$2,$3,$4,'M',100)", [size, product, biz, location])
  }
  const date = (await db.query("select (current_date+1)::text pickup,(current_date+3)::text ret")).rows[0]
  const payload = (extra = {}) => ({
    businessId: biz, branchId: branch, requestId: randomUUID(), customer: { id: customer },
    dates: { pickup_date: date.pickup, return_date: date.ret }, payment: { advance_amount: 0, deposit_amount: 0 },
    items: [{ item_id: item, variant_id: variant, quantity: 1, price: 100 }], ...extra,
  })
  const create = async input => (await db.query('select create_priced_booking($1::jsonb) result', [JSON.stringify(input)])).rows[0].result
  const settings = async (prefix, next = 1001, location = branch) => (await db.query('select save_booking_number_settings($1,$2,$3) result', [location, prefix, next])).rows[0].result
  const counter = async (location = branch) => Number((await db.query('select next_number from booking_number_settings where branch_id=$1', [location])).rows[0]?.next_number)
  async function isolated(name, fn) {
    await t.test(name, async () => {
      await db.exec('begin')
      try { await fn() } finally { await db.exec('rollback') }
    })
  }
  async function rejects(fn, pattern) {
    await db.exec('savepoint rejected')
    await assert.rejects(fn(), pattern)
    await db.exec('rollback to savepoint rejected')
  }

  await isolated('custom advances ignore the suggested minimum and retain correct balances', async () => {
    await db.query('update branches set settings = settings || $1::jsonb where id=$2', [JSON.stringify({ min_advance_pct: 80 }), branch])
    for (const advance of [0, 12.34, 100]) {
      const created = await create(payload({ payment: { advance_amount: advance, deposit_amount: 0, method: 'cash' } }))
      const row = (await db.query('select advance_amount,amount_paid,balance_due from bookings where id=$1', [created.booking_id])).rows[0]
      assert.equal(Number(row.advance_amount), advance)
      assert.equal(Number(row.amount_paid), advance)
      assert.equal(Number(row.balance_due), 100 - advance)
      const payments = (await db.query("select count(*) count from booking_payments where booking_id=$1 and type='advance'", [created.booking_id])).rows[0]
      assert.equal(Number(payments.count), advance > 0 ? 1 : 0)
    }
    for (const advance of [-1, 100.01, 'NaN']) {
      await rejects(() => create(payload({ payment: { advance_amount: advance, deposit_amount: 0 } })), /Advance must be between/)
    }
  })

  await isolated('legacy format remains active until settings are saved; existing IDs stay unchanged', async () => {
    const old = await create(payload())
    assert.match(old.booking_number, /^ONE-\d{6}-[A-F0-9]{8}$/)
    await settings(' fabb ')
    assert.equal((await create(payload())).booking_number, 'FABB-1001')
    assert.equal((await db.query('select booking_number from bookings where id=$1', [old.booking_id])).rows[0].booking_number, old.booking_number)
    await rejects(() => db.query("update bookings set booking_number='RENAMED' where id=$1", [old.booking_id]), /cannot be changed/)
  })
  await isolated('sequences are per branch; manual numbers normalize without advancing counters', async () => {
    await settings('ONE')
    await settings('TWO', 4000, branch2)
    assert.equal((await create(payload({ customBookingNumber: ' manual/26_001 ' }))).booking_number, 'MANUAL/26_001')
    assert.equal(await counter(), 1001)
    assert.equal((await create(payload())).booking_number, 'ONE-1001')
    assert.equal((await create(payload({ branchId: branch2, items: [{ item_id: item2, variant_id: variant2, quantity: 1, price: 100 }] }))).booking_number, 'TWO-4000')
    assert.equal(await counter(), 1002)
    assert.equal(await counter(branch2), 4001)
  })
  await isolated('custom duplicates are rejected globally and automatic numbers skip them', async () => {
    await settings('ONE')
    await create(payload({ customBookingNumber: 'ONE-1001', branchId: branch2, items: [{ item_id: item2, variant_id: variant2, quantity: 1, price: 100 }] }))
    await rejects(() => create(payload({ customBookingNumber: ' one-1001 ' })), /already in use/)
    assert.equal((await create(payload())).booking_number, 'ONE-1002')
    assert.equal(await counter(), 1003)
  })
  await isolated('retrying a request returns its booking without incrementing again', async () => {
    await settings('ONE')
    const input = payload()
    const first = await create(input)
    assert.deepEqual(await create(input), first)
    assert.equal(await counter(), 1002)
    assert.equal((await db.query('select count(*)::int count from bookings where creation_request_id=$1', [input.requestId])).rows[0].count, 1)
  })
  await isolated('failed inserts roll back counter updates', async () => {
    await settings('ONE')
    await rejects(() => db.query("insert into bookings(business_id,branch_id,booking_number,pickup_date,return_date) values($1,$2,null,current_date+2,current_date)", [biz, branch]), /check constraint/)
    assert.equal(await counter(), 1001)
    assert.equal((await create(payload())).booking_number, 'ONE-1001')
  })
  await isolated('counter cannot move backward or reset with a new prefix', async () => {
    await settings('ONE')
    await create(payload())
    await rejects(() => settings('NEW', 1001), /cannot move backwards/)
    await settings('NEW', 2000)
    assert.equal((await create(payload())).booking_number, 'NEW-2000')
    assert.equal((await db.query("select count(*)::int count from audit_log where action='booking.numbering_updated'")).rows[0].count, 2)
  })
  await isolated('custom input and prefix bounds are validated by the database', async () => {
    for (const number of ['bad number', 'A'.repeat(41), '<bad>']) await rejects(() => create(payload({ customBookingNumber: number })), /Booking number must/)
    for (const prefix of ['', 'A'.repeat(21), 'bad prefix']) await rejects(() => settings(prefix), /Prefix must/)
    await rejects(() => settings('ONE', 0), /whole next number/)
    assert.equal((await create(payload({ customBookingNumber: 'A'.repeat(40) }))).booking_number.length, 40)
    assert.match((await create(payload({ customBookingNumber: '   ' }))).booking_number, /^ONE-/)
  })
  await isolated('booking staff can create custom IDs but cannot change counters or access another branch', async () => {
    await settings('ONE')
    await settings('TWO', 1001, branch2)
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [staff])
    await db.exec('set local role authenticated')
    assert.equal((await create(payload({ customBookingNumber: 'STAFF-1' }))).booking_number, 'STAFF-1')
    assert.equal((await create(payload())).booking_number, 'ONE-1001')
    await rejects(() => settings('EDIT'), /permission required/)
    await rejects(() => db.query('update booking_number_settings set next_number=1 where branch_id=$1', [branch]), /permission denied/)
    assert.equal((await db.query('select * from booking_number_settings where branch_id=$1', [branch2])).rows.length, 0)
    await rejects(() => create(payload({ branchId: branch2 })), /Branch access required/)
    await db.exec('reset role')
  })
  await isolated('unauthenticated users cannot configure or consume numbering', async () => {
    await db.query("select set_config('request.jwt.claim.sub','',true)")
    await rejects(() => settings('NO'), /Not authenticated/)
    await rejects(() => create(payload()), /Booking permission required/)
  })
  await isolated('overlapping requests receive distinct numbers and retries return one booking', async () => {
    await settings('ONE')
    const first = payload(), second = payload()
    const results = await Promise.all([create(first), create(second), create(first)])
    assert.equal(results[0].booking_id, results[2].booking_id)
    assert.notEqual(results[0].booking_number, results[1].booking_number)
    assert.equal(await counter(), 1003)
  })
})
