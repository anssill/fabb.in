import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createTestDatabase } from './helpers/database.mjs'

test('booking product editing is atomic and respects stock, history and access', async t => {
  const db = await createTestDatabase()
  t.after(() => db.close())
  const owner=randomUUID(), staff=randomUUID(), biz=randomUUID(), branch=randomUUID(), otherBranch=randomUUID(), customer=randomUUID()
  const item=randomUUID(), variant=randomUUID(), second=randomUUID(), secondVariant=randomUUID()
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)',[owner,'edit-owner@test.invalid',staff,'edit-staff@test.invalid'])
  await db.query("insert into businesses(id,name,slug,owner_id) values ($1,'Edit test','edit-test',$2)",[biz,owner])
  await db.query("insert into branches(id,business_id,name,prefix) values ($1,$2,'Main','MAIN'),($3,$2,'Other','OTHER')",[branch,biz,otherBranch])
  await db.query("insert into staff(id,business_id,branch_id,email,role,permissions) values ($1,$2,$3,'edit-owner@test.invalid','owner','{}'),($4,$2,$3,'edit-staff@test.invalid','staff','{}')",[owner,biz,branch,staff])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.query("insert into customers(id,business_id,branch_id,name,phone) values ($1,$2,$3,'Customer','9999999999')",[customer,biz,branch])
  for (const [product,size] of [[item,variant],[second,secondVariant]]) {
    await db.query("insert into items(id,business_id,branch_id,name,category,price) values ($1,$2,$3,'Product','test',100)",[product,biz,branch])
    await db.query("insert into item_variants(id,item_id,business_id,branch_id,size,total_stock) values ($1,$2,$3,$4,'M',5)",[size,product,biz,branch])
  }
  const state=async id=>(await db.query('select *,updated_at::text as version from bookings where id=$1',[id])).rows[0]
  const lines=async id=>(await db.query('select * from booking_items where booking_id=$1 order by id',[id])).rows
  const extra={item_id:second,variant_id:secondVariant,quantity:1,price:200,discount_percent:10}
  async function fixture() {
    const id=randomUUID(), line=randomUUID()
    await db.query("insert into bookings(id,business_id,branch_id,customer_id,booking_number,status,pickup_date,return_date,subtotal,total_amount,balance_due) values ($1,$2,$3,$4,$5,'confirmed',current_date+1,current_date+2,200,200,200)",[id,biz,branch,customer,id])
    await db.query("insert into booking_items(id,booking_id,business_id,branch_id,item_id,item_variant_id,item_name,size,quantity,price,rental_days,rate_basis) values ($1,$2,$3,$4,$5,$6,'First','M',2,100,1,'booking')",[line,id,biz,branch,item,variant])
    return {id,version:(await state(id)).version,line:{booking_item_id:line,item_id:item,variant_id:variant,quantity:2,price:100,discount_percent:0}}
  }
  const save=(f,items,reason=null,version=f.version)=>db.query('select update_booking_items($1,$2::jsonb,$3,$4)',[f.id,JSON.stringify(items),version,reason])
  async function isolated(name,fn) {
    await t.test(name,async()=>{await db.exec('begin');try{await fn()}finally{await db.exec('rollback')}})
  }
  async function rejects(promise,pattern) {
    await db.exec('savepoint failure')
    await assert.rejects(promise(),pattern)
    await db.exec('rollback to savepoint failure')
  }
  await isolated('new bookings persist multiple different products together',async()=>{
    await db.exec('set local role authenticated')
    const result=(await db.query('select create_priced_booking($1::jsonb) as result',[JSON.stringify({
      businessId:biz,branchId:branch,requestId:randomUUID(),customer:{id:customer},
      dates:{pickup_date:'2027-01-10',return_date:'2027-01-12'},payment:{advance_amount:0,deposit_amount:0,method:'cash'},
      items:[{item_id:item,variant_id:variant,quantity:2,price:100,discount_percent:0},extra],
    })])).rows[0].result
    assert.equal((await lines(result.booking_id)).length,2)
    assert.equal(Number((await state(result.booking_id)).total_amount),380)
  })
  await isolated('adds another product and edits price, discount and quantity as authenticated owner',async()=>{
    const f=await fixture();await db.exec('set local role authenticated')
    await save(f,[{...f.line,price:150,quantity:3,discount_percent:20},extra])
    const b=await state(f.id);assert.equal(Number(b.total_amount),540);assert.equal(Number(b.balance_due),540)
    const updated=await lines(f.id);assert.equal(updated.length,2);assert.ok(updated.some(l=>l.id===f.line.booking_item_id))
    assert.equal((await db.query("select count(*)::int n from audit_log where record_id=$1 and action='booking.items_updated'",[f.id])).rows[0].n,1)
  })
  await isolated('removing an item releases its reservation and keeps the booking',async()=>{
    const f=await fixture();await save(f,[extra]);assert.equal((await lines(f.id)).length,1)
    const a=(await db.query('select available_quantity from get_rental_availability($1,$2,current_date+1,current_date+2,$3,$4,0)',[biz,branch,item,variant])).rows[0]
    assert.equal(a.available_quantity,5);assert.equal(Number((await state(f.id)).total_amount),180)
  })
  await isolated('unchanged quantities do not count their own reservation twice',async()=>{
    const f=await fixture();await db.query('update item_variants set total_stock=2 where id=$1',[variant]);await save(f,[{...f.line,price:120}]);assert.equal(Number((await state(f.id)).total_amount),240)
  })
  await isolated('stock shortage rolls back all changes without an authorized reason',async()=>{
    const f=await fixture();await rejects(()=>save(f,[{...f.line,price:300},{...extra,quantity:6}]),/Stock is unavailable/)
    assert.equal(Number((await state(f.id)).total_amount),200);assert.equal((await lines(f.id)).length,1);assert.equal(Number((await lines(f.id))[0].price),100)
  })
  await isolated('authorized shortage is audited',async()=>{
    const f=await fixture();await save(f,[{...f.line,quantity:6}], 'Approved external stock');assert.equal((await state(f.id)).overbook_reason,'Approved external stock')
  })
  await isolated('stale versions cannot overwrite edits',async()=>{
    const f=await fixture();await save(f,[{...f.line,price:120}]);await rejects(()=>save(f,[f.line]),/booking changed/)
  })
  await isolated('empty list, duplicate sizes and invalid quantity are rejected',async()=>{
    const f=await fixture();await rejects(()=>save(f,[]),/at least one/);await rejects(()=>save(f,[f.line,f.line]),/repeated sizes/);await rejects(()=>save(f,[{...f.line,quantity:1.5}]),/integer|Invalid quantity/)
  })
  await isolated('foreign booking line IDs are rejected',async()=>{
    const f=await fixture();await rejects(()=>save(f,[{...f.line,booking_item_id:randomUUID()}]),/not found/)
  })
  await isolated('archived and other-branch products cannot be added',async()=>{
    const f=await fixture();await db.query('update item_variants set archived_at=now() where id=$1',[secondVariant]);await rejects(()=>save(f,[f.line,extra]),/not available/)
    await db.query('update item_variants set archived_at=null,branch_id=$2 where id=$1',[secondVariant,otherBranch]);await rejects(()=>save(f,[f.line,extra]),/not available/)
  })
  await isolated('pickup history blocks product replacement',async()=>{
    const f=await fixture();await db.query('update booking_items set picked_up_quantity=1 where booking_id=$1',[f.id]);await rejects(()=>save(f,[extra]),/pickup or return history/)
  })
  await isolated('picked-up bookings keep fulfillment intact',async()=>{
    const f=await fixture();await db.query("update bookings set status='picked_up' where id=$1",[f.id]);await rejects(()=>save(f,[extra]),/before pickup/)
  })
  await isolated('payments remain recorded and total cannot fall below collected rent',async()=>{
    const f=await fixture();await db.query("select post_booking_payment($1,'advance',150,'cash',null,null,'test-edit-advance')",[f.id]);f.version=(await state(f.id)).version
    await rejects(()=>save(f,[{...f.line,price:50}]),/refund first/);assert.equal(Number((await state(f.id)).amount_paid),150)
    await save(f,[f.line,extra]);assert.equal(Number((await state(f.id)).balance_due),230)
  })
  await isolated('legacy daily rates, discounts and tax are preserved',async()=>{
    const f=await fixture();await db.query("update booking_items set rental_days=3,rate_basis='day' where booking_id=$1",[f.id])
    await db.query('update bookings set subtotal=600,discount_amount=100,tax_amount=50,total_amount=550 where id=$1',[f.id]);f.version=(await state(f.id)).version
    await save(f,[{...f.line,price:200},extra]);const b=await state(f.id);assert.equal(Number(b.total_amount),1408);assert.equal(Number(b.tax_amount),128)
    assert.equal((await lines(f.id)).find(l=>l.id===f.line.booking_item_id).rental_days,3)
  })
  await isolated('staff without booking permission cannot edit',async()=>{
    const f=await fixture();await db.query("select set_config('request.jwt.claim.sub',$1,true)",[staff]);await db.exec('set local role authenticated');await rejects(()=>save(f,[extra]),/permission required/)
  })
})
