import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createTestDatabase } from './helpers/database.mjs'
import { loadSource } from './helpers/load-source.mjs'
const {paymentParts,paymentError}=loadSource('src/lib/payment-splits.ts')
test('split amounts use currency precision and preserve separate references',()=>{
 assert.equal(paymentParts(0.3,{method:'cash',splits:[{method:'cash',amount:0.1},{method:'upi',amount:0.2,reference:' UTR-1 '} ]})[1].reference,'UTR-1')
 for(const parts of [[{method:'cash',amount:20}],[],[{method:'cash',amount:0},{method:'upi',amount:100}],[{method:'cash',amount:NaN}],[{method:'invalid',amount:100}],[{method:'cash',amount:100.001}]]) assert.ok(paymentError(100,{method:'cash',splits:parts}))
 assert.equal(paymentParts(25,{method:'upi'}).length,1)
 assert.equal(paymentParts(0,{method:'cash'}).length,0)
})
test('split collections are atomic, authorized and idempotent across booking flows',async t=>{
 const db=await createTestDatabase();t.after(()=>db.close())
 const owner=randomUUID(),staff=randomUUID(),biz=randomUUID(),branch=randomUUID(),customer=randomUUID(),item=randomUUID(),variant=randomUUID()
 await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)',[owner,'split-owner@test.invalid',staff,'split-staff@test.invalid'])
 await db.query("insert into businesses(id,name,slug,owner_id) values ($1,'Split','split-test',$2)",[biz,owner])
 await db.query("insert into branches(id,business_id,name,prefix) values ($1,$2,'Main','MAIN')",[branch,biz])
 await db.query("insert into staff(id,business_id,branch_id,email,role,permissions) values ($1,$2,$3,'split-owner@test.invalid','owner','{}'),($4,$2,$3,'split-staff@test.invalid','staff','{}')",[owner,biz,branch,staff])
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
 await db.query("insert into customers(id,business_id,branch_id,name,phone) values ($1,$2,$3,'Customer','9999999999')",[customer,biz,branch])
 await db.query("insert into items(id,business_id,branch_id,name,category,price) values ($1,$2,$3,'Shirt','test',1000)",[item,biz,branch])
 await db.query("insert into item_variants(id,item_id,business_id,branch_id,size,total_stock) values ($1,$2,$3,$4,'M',5)",[variant,item,biz,branch])
 const create=payment=>db.query('select create_priced_booking($1::jsonb) as result',[JSON.stringify({businessId:biz,branchId:branch,requestId:randomUUID(),customer:{id:customer},dates:{pickup_date:'2027-01-10',return_date:'2027-01-12'},payment,items:[{item_id:item,variant_id:variant,quantity:1,price:1000}]})])
 const parts=[{method:'cash',amount:100},{method:'upi',amount:200,reference:'UPI-123'}]
 const split=(id,total=300,p=parts,key=randomUUID(),type='balance')=>db.query('select post_booking_payment_split($1,$2,$3,$4::jsonb,$5) as result',[id,type,total,JSON.stringify(p),key])
 const payments=async id=>(await db.query('select * from booking_payments where booking_id=$1',[id])).rows
 const balance=async id=>Number((await db.query('select balance_due from bookings where id=$1',[id])).rows[0].balance_due)
 const reject=async(fn,pattern)=>{await db.exec('savepoint failure');await assert.rejects(fn,pattern);await db.exec('rollback to savepoint failure')}
 const isolated=async(name,fn)=>t.test(name,async()=>{await db.exec('begin');try{await fn()}finally{await db.exec('rollback')}})
 await isolated('advance and deposit splits persist with separate methods and balances',async()=>{
  await db.exec('set local role authenticated')
  const id=(await create({advance_amount:300,deposit_amount:300,method:'cash',splits:parts,deposit_splits:parts})).rows[0].result.booking_id
  const rows=await payments(id);assert.equal(rows.length,4);assert.equal(rows.filter(p=>p.method==='upi').length,2);assert.equal(await balance(id),700)
 })
 await isolated('partial payment leaves a balance and retry creates no duplicate',async()=>{
  const id=(await create({advance_amount:0,deposit_amount:0,method:'cash'})).rows[0].result.booking_id
  await db.exec('set local role authenticated');const key=randomUUID();const a=await split(id,300,parts,key);const b=await split(id,300,parts,key)
  assert.deepEqual(a.rows,b.rows);assert.equal((await payments(id)).length,2);assert.equal(await balance(id),700)
  await reject(()=>split(id,400,[...parts,{method:'card',amount:100}],key),/already used/)
  assert.equal((await payments(id)).length,2)
 })
 await isolated('overpayment rolls back the cash part too',async()=>{
  const id=(await create({advance_amount:0,deposit_amount:0})).rows[0].result.booking_id
  await reject(()=>split(id,1100,[{method:'cash',amount:500},{method:'upi',amount:600}]),/exceeds/)
  assert.equal((await payments(id)).length,0);assert.equal(await balance(id),1000)
  await reject(()=>split(id,301),/add up/)
 })
 await isolated('payment permission is required',async()=>{
  const id=(await create({advance_amount:0,deposit_amount:0})).rows[0].result.booking_id
  await db.query("select set_config('request.jwt.claim.sub',$1,true)",[staff]);await db.exec('set local role authenticated')
  await reject(()=>split(id),/permission/)
 })
 await isolated('pickup accepts balance and deposit across more than two methods atomically',async()=>{
  const id=(await create({advance_amount:0,deposit_amount:0})).rows[0].result.booking_id
  await db.exec('set local role authenticated')
  const input={status:'picked_up',payments:[...parts.map(p=>({...p,type:'balance'})),...parts.map(p=>({...p,type:'deposit'}))]};const key=randomUUID()
  const run=()=>db.query('select apply_booking_command($1,$2::jsonb,$3)',[id,JSON.stringify(input),key])
  await run();await run();assert.equal((await payments(id)).length,4);assert.equal(await balance(id),700)
 })
 await isolated('invalid creation allocations roll back the whole booking',async()=>{
  const before=(await db.query('select count(*)::int n from bookings')).rows[0].n
  await reject(()=>create({advance_amount:400,deposit_amount:0,method:'cash',splits:parts}),/add up/)
  assert.equal((await db.query('select count(*)::int n from bookings')).rows[0].n,before)
 })
})
