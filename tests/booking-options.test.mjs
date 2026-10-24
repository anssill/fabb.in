import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createTestDatabase } from './helpers/database.mjs'
import { loadSource } from './helpers/load-source.mjs'

test('rupee discounts retain exact paise and percentages remain compatible', () => {
  const { calculateItemPricing, clampItemDiscount } = loadSource('src/lib/booking-pricing.ts')
  assert.equal(calculateItemPricing({ price: 333, quantity: 3, discount_flat: 100 }).total_amount, 899)
  assert.equal(calculateItemPricing({ price: 333, quantity: 3, discount_flat: 123.45 }).discount_amount, 123.45)
  assert.equal(calculateItemPricing({ price: 100, quantity: 2, discount_percent: 10 }).total_amount, 180)
  assert.throws(() => calculateItemPricing({ price: 100, quantity: 1, discount_flat: 101 }), /subtotal/)
  assert.equal(clampItemDiscount({ price: 50, quantity: 1, discount_flat: 100 }).discount_flat, 50)
})

test('booking options preserve money, customer identity, contacts and branch isolation', async t => {
  const db = await createTestDatabase(); t.after(() => db.close())
  const owner=randomUUID(), biz=randomUUID(), branch=randomUUID(), other=randomUUID(), customer=randomUUID(), stranger=randomUUID(), item=randomUUID(), variant=randomUUID(), second=randomUUID(), secondVariant=randomUUID()
  await db.query('insert into auth.users(id,email) values($1,$2)',[owner,'options@test.invalid'])
  await db.query("insert into businesses(id,name,slug,owner_id) values($1,'Options','options-test',$2)",[biz,owner])
  await db.query("insert into branches(id,business_id,name,prefix) values($1,$2,'Main','MAIN'),($3,$2,'Other','OTHER')",[branch,biz,other])
  await db.query("insert into staff(id,business_id,branch_id,email,role,permissions) values($1,$2,$3,'options@test.invalid','owner','{}')",[owner,biz,branch])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.query("insert into customers(id,business_id,branch_id,name,phone) values($1,$2,$3,'Existing Customer','9999999999'),($4,$2,$5,'Other only','8888888888')",[customer,biz,branch,stranger,other])
  for (const [product,size,location] of [[item,variant,branch],[second,secondVariant,other]]) {
    await db.query("insert into items(id,business_id,branch_id,name,category,price) values($1,$2,$3,'Suit','Suits',333)",[product,biz,location])
    await db.query("insert into item_variants(id,item_id,business_id,branch_id,size,total_stock) values($1,$2,$3,$4,'M',20)",[size,product,biz,location])
  }
  const create = (overrides={}) => db.query('select create_priced_booking($1::jsonb) as result',[JSON.stringify({ businessId:biz,branchId:branch,requestId:randomUUID(),customer:{id:customer,additional_phones:['7777777777']}, dates:{pickup_date:'2027-01-10',return_date:'2027-01-12'},payment:{advance_amount:0},items:[{item_id:item,variant_id:variant,quantity:3,price:333,discount_flat:100}],...overrides })])
  const isolated=async(name,fn)=>t.test(name,async()=>{await db.exec('begin');try{await fn()}finally{await db.exec('rollback')}})
  await isolated('optional preparation saves with the booking and is preserved on retry',async()=>{
    await db.exec('set local role authenticated')
    const requestId=randomUUID()
    const photo='/api/rental-evidence?path='+encodeURIComponent(`${biz}/condition/${branch}/${requestId}/${randomUUID()}.jpeg`)
    const input={requestId,dates:{pickup_date:'2027-01-10',return_date:'2027-01-12',alteration_notes:' Shorten sleeves ',condition_notes:'Small mark on cuff',condition_photos:[photo]}}
    const id=(await create(input)).rows[0].result.booking_id
    const saved=(await db.query('select alteration_notes,condition_notes,condition_photos from bookings where id=$1',[id])).rows[0]
    assert.equal(saved.alteration_notes,'Shorten sleeves')
    assert.equal(saved.condition_notes,'Small mark on cuff')
    assert.deepEqual(saved.condition_photos,[photo])
    await create({...input,dates:{...input.dates,condition_notes:'Changed'}})
    assert.equal((await db.query('select condition_notes from bookings where id=$1',[id])).rows[0].condition_notes,'Small mark on cuff')
  })
  await isolated('preparation can be skipped entirely',async()=>{
    const id=(await create()).rows[0].result.booking_id
    const saved=(await db.query('select alteration_notes,condition_notes,condition_photos from bookings where id=$1',[id])).rows[0]
    assert.equal(saved.alteration_notes,null); assert.equal(saved.condition_notes,null); assert.deepEqual(saved.condition_photos,[])
  })
  await isolated('condition evidence storage enforces branch read and write access',async()=>{
    const employee=randomUUID()
    await db.query('insert into auth.users(id,email) values($1,$2)',[employee,'condition@test.invalid'])
    await db.query(`insert into staff(id,business_id,branch_id,email,role,permissions) values($1,$2,$3,'condition@test.invalid','staff','{"manage_bookings":true}')`,[employee,biz,branch])
    const ownPath=`${biz}/condition/${branch}/${randomUUID()}/${randomUUID()}.jpeg`
    const otherPath=`${biz}/condition/${other}/${randomUUID()}/${randomUUID()}.jpeg`
    await db.query("insert into storage.objects(bucket_id,name) values('rental-evidence',$1)",[otherPath])
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[employee])
    await db.exec('set local role authenticated')
    await db.query("insert into storage.objects(bucket_id,name) values('rental-evidence',$1)",[ownPath])
    assert.deepEqual((await db.query("select name from storage.objects where bucket_id='rental-evidence'")).rows.map(row=>row.name),[ownPath])
    await db.exec('savepoint wrong_branch')
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('rental-evidence',$1)",[otherPath]),/row-level security/)
    await db.exec('rollback to savepoint wrong_branch')
  })
  await isolated('foreign evidence paths are rejected before creating a booking',async()=>{
    await db.exec('savepoint invalid_photo')
    await assert.rejects(create({dates:{pickup_date:'2027-01-10',return_date:'2027-01-12',condition_photos:['https://example.com/photo.jpg']}}),/Invalid condition photo/)
    await db.exec('rollback to savepoint invalid_photo')
    assert.equal(Number((await db.query('select count(*) as n from bookings')).rows[0].n),0)
  })
  await isolated('date availability reflects inclusive reservations and releases stock afterwards',async()=>{
    await create()
    const check=async(from,to)=>(await db.query('select * from get_rental_availability($1,$2,$3,$4,$5,$6,0)',[biz,branch,from,to,item,variant])).rows[0]
    assert.equal((await check('2027-01-12','2027-01-12')).available_quantity,17)
    assert.equal((await check('2027-01-13','2027-01-14')).available_quantity,20)
  })
  await isolated('order taker is saved separately from the creator and retries preserve it',async()=>{
    const requestId=randomUUID()
    const input={requestId,dates:{pickup_date:'2027-01-10',return_date:'2027-01-12',order_taken_by:'  Reception staff  '}}
    const id=(await create(input)).rows[0].result.booking_id
    const booking=(await db.query('select order_taken_by,created_by from bookings where id=$1',[id])).rows[0]
    assert.equal(booking.order_taken_by,'Reception staff')
    assert.equal(booking.created_by,owner)
    const retry=(await create({...input,dates:{...input.dates,order_taken_by:'Someone else'}})).rows[0].result.booking_id
    assert.equal(retry,id)
    assert.equal((await db.query('select order_taken_by from bookings where id=$1',[id])).rows[0].order_taken_by,'Reception staff')
  })
  await isolated('flat amount saves exactly and extra numbers are saved with the existing customer',async()=>{
    await db.exec('set local role authenticated')
    const id=(await create()).rows[0].result.booking_id
    const b=(await db.query('select total_amount,additional_contact_numbers from bookings where id=$1',[id])).rows[0]
    assert.equal(Number(b.total_amount),899); assert.deepEqual(b.additional_contact_numbers,['7777777777'])
    const line=(await db.query('select discount_flat,discount_amount,line_total from booking_items where booking_id=$1',[id])).rows[0]
    assert.equal(Number(line.discount_amount),100); assert.equal(Number(line.line_total),899)
    const found=(await db.query("select search_business_customers('7777777777') as result")).rows[0].result
    assert.equal(found[0].id,customer)
  })
  await isolated('existing customer is reused in another branch and branch counts are independent',async()=>{
    const id=(await create({branchId:other,customer:{name:'Same person',phone:'9999999999'},items:[{item_id:second,variant_id:secondVariant,quantity:1,price:333}]})).rows[0].result.booking_id
    assert.equal((await db.query('select customer_id from bookings where id=$1',[id])).rows[0].customer_id,customer)
    assert.equal(Number((await db.query('select count(*) as n from customers')).rows[0].n),2)
    const main=(await db.query('select id,total_bookings from customer_branch_summary where branch_id=$1',[branch])).rows
    assert.equal(main.length,1); assert.equal(Number(main[0].total_bookings),0)
    const visited=(await db.query('select total_bookings from customer_branch_summary where id=$1 and branch_id=$2',[customer,other])).rows[0]
    assert.equal(Number(visited.total_bookings),1)
  })
  await isolated('invalid extra contacts roll back the entire booking',async()=>{
    await db.exec('savepoint invalid_contacts')
    await assert.rejects(create({customer:{id:customer,additional_phones:['123']}}),/valid additional/)
    await db.exec('rollback to savepoint invalid_contacts')
    assert.equal(Number((await db.query('select count(*) as n from bookings')).rows[0].n),0)
  })
  await isolated('item edits preserve flat discounts and can switch back to percent',async()=>{
    const id=(await create()).rows[0].result.booking_id
    const b=(await db.query('select updated_at::text as version from bookings where id=$1',[id])).rows[0]
    const line=(await db.query('select id from booking_items where booking_id=$1',[id])).rows[0]
    await db.query('select update_booking_items($1,$2::jsonb,$3)',[id,JSON.stringify([{booking_item_id:line.id,item_id:item,variant_id:variant,quantity:3,price:333,discount_flat:123.45}]),b.version])
    assert.equal(Number((await db.query('select total_amount from bookings where id=$1',[id])).rows[0].total_amount),875.55)
    const changed=(await db.query('select updated_at::text as version from bookings where id=$1',[id])).rows[0]
    await db.query('select update_booking_item_pricing($1,$2::jsonb,$3)',[id,JSON.stringify([{id:line.id,price:333,discount_percent:10,discount_flat:null}]),changed.version])
    assert.equal(Number((await db.query('select total_amount from bookings where id=$1',[id])).rows[0].total_amount),899.10)
  })
  await isolated('bill search finds records older than the latest 200 and respects branch selection',async()=>{
    await db.query("insert into bookings(business_id,branch_id,customer_id,created_by,booking_number,status,pickup_date,return_date,subtotal,total_amount,balance_due,physical_bill_number,created_at) select $1,$2,$3,$4,'SEARCH-'||n,'draft','2027-01-10','2027-01-12',100,100,100,case when n=1 then 'OLD-BILL-123' else null end,now()-(206-n)*interval '1 day' from generate_series(1,205) n",[biz,branch,customer,owner])
    const found=(await db.query("select * from search_booking_ids($1,'OLD-BILL-123')",[branch])).rows
    assert.equal(found.length,1)
    assert.equal((await db.query("select * from search_booking_ids($1,'OLD-BILL-123')",[other])).rows.length,0)
  })
})
