import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createTestDatabase } from './helpers/database.mjs'

test('rental transactions, branch isolation and notification scheduling', async t => {
  const db = await createTestDatabase()
  t.after(() => db.close())
  const owner=randomUUID(), staff=randomUUID(), biz=randomUUID(), branch=randomUUID(), branch2=randomUUID(), customer=randomUUID(), item=randomUUID(), variant=randomUUID()
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)',[owner,'owner@example.test',staff,'staff@example.test'])
  await db.query("insert into businesses(id,name,slug,owner_id,timezone) values ($1,'Synthetic business','test',$2,'UTC')",[biz,owner])
  await db.query("insert into branches(id,business_id,name,prefix) values ($1,$2,'Main','MAIN'),($3,$2,'Second','SEC')",[branch,biz,branch2])
  await db.query("insert into staff(id,business_id,branch_id,email,role,permissions) values ($1,$2,$3,'owner@example.test','owner','{}'),($4,$2,$3,'staff@example.test','staff','{\"manage_bookings\":true,\"manage_customers\":true}')",[owner,biz,branch,staff])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.query("insert into customers(id,business_id,branch_id,name,phone) values ($1,$2,$3,'Synthetic customer','9999999999')",[customer,biz,branch])
  await db.query("insert into items(id,business_id,branch_id,name,category) values ($1,$2,$3,'Shirt','test')",[item,biz,branch])
  await db.query("insert into item_variants(id,item_id,business_id,branch_id,size,total_stock) values ($1,$2,$3,$4,'M',10)",[variant,item,biz,branch])
  async function fixture({ total=0, status='picked_up', location=branch }={}) {
    const booking=randomUUID(), line=randomUUID()
    await db.query("insert into bookings(id,business_id,branch_id,customer_id,booking_number,status,pickup_date,return_date,total_amount,balance_due) values ($1,$2,$3,$4,$5,$6::rental_booking_status,current_date+1,current_date+2,$7,$7)",[booking,biz,location,customer,booking,status,total])
    await db.query("insert into booking_items(id,booking_id,business_id,branch_id,item_id,item_variant_id,item_name,size,quantity,price,rental_days,picked_up_quantity) values ($1,$2,$3,$4,$5,$6,'Shirt','M',2,$7,1,$8)",[line,booking,biz,location,item,variant,total/2,status==='picked_up'?2:0])
    return {booking,line}
  }
  const command=(booking,input,key=randomUUID())=>db.query('select apply_booking_command($1,$2::jsonb,$3)',[booking,JSON.stringify(input),key])
  const receive=(f,quantity,key=randomUUID(),extra={})=>command(f.booking,{status:'returned',returns:[{bookingItemId:f.line,quantity,unavailableQuantity:0,...extra}]},key)
  const payment=(id,type,amount,key=randomUUID())=>db.query("select post_booking_payment($1,$2,$3,'cash',null,null,$4) id",[id,type,amount,key])
  const bookingState=async id=>(await db.query('select * from bookings where id=$1',[id])).rows[0]
  async function isolated(name,fn){await t.test(name,async()=>{await db.exec('begin');try{await fn()}finally{await db.exec('rollback')}})}
  await isolated('partial returns stay open; retries do not duplicate stock movements',async()=>{
    const f=await fixture();await receive(f,1,'partial');assert.equal((await bookingState(f.booking)).status,'partially_returned');await receive(f,1,'partial');assert.equal((await db.query('select returned_quantity from booking_items where id=$1',[f.line])).rows[0].returned_quantity,1);await receive(f,1,'complete');assert.equal((await bookingState(f.booking)).status,'closed')
  })
  await isolated('unpaid full return stays open until the final rental payment',async()=>{
    const f=await fixture({total:100});await receive(f,2);assert.equal((await bookingState(f.booking)).status,'returned');await payment(f.booking,'balance',100,'final');assert.equal((await bookingState(f.booking)).status,'closed');await payment(f.booking,'balance',100,'final');assert.equal((await db.query('select count(*)::int n from booking_payments where booking_id=$1',[f.booking])).rows[0].n,1)
  })
  await isolated('pending deposit does not prevent closure; later settlement is retry safe',async()=>{
    const f=await fixture();await payment(f.booking,'deposit',100);await receive(f,2);assert.equal((await bookingState(f.booking)).status,'closed');for(let i=0;i<2;i++)await db.query("select settle_booking_deposit($1,80,20,'cash','Damage','deposit-settle')",[f.booking]);assert.equal(Number((await bookingState(f.booking)).deposit_amount),0)
  })
  await isolated('missing items cannot be marked received and failed lines roll back',async()=>{
    const f=await fixture();await db.exec('savepoint invalid_return');await assert.rejects(receive(f,1,randomUUID(),{reason:'missing'}),/Missing items/);await db.exec('rollback to savepoint invalid_return');await db.exec('savepoint invalid_second');await assert.rejects(command(f.booking,{status:'returned',returns:[{bookingItemId:f.line,quantity:1},{bookingItemId:randomUUID(),quantity:1}]}),/does not belong/);await db.exec('rollback to savepoint invalid_second');assert.equal((await db.query('select returned_quantity from booking_items where id=$1',[f.line])).rows[0].returned_quantity,0)
  })
  await isolated('same payment key cannot charge a different amount',async()=>{
    const f=await fixture({total:100});await payment(f.booking,'balance',30,'same-key');await db.exec('savepoint changed');await assert.rejects(payment(f.booking,'balance',40,'same-key'),/already used/);await db.exec('rollback to savepoint changed');assert.equal(Number((await bookingState(f.booking)).amount_paid),30)
  })
  await isolated('customer totals exclude deposits and other branch records',async()=>{
    const f=await fixture({total:100});await payment(f.booking,'balance',100);await payment(f.booking,'deposit',200);await payment(f.booking,'refund',20);const other=await fixture({total:500,location:branch2});await payment(other.booking,'balance',500);const summary=(await db.query('select * from customer_branch_summary where id=$1',[customer])).rows[0];assert.equal(Number(summary.total_bookings),1);assert.equal(Number(summary.total_spent),80);assert.equal(Number(summary.outstanding_balance),20)
  })
  await isolated('home branch is permanent; switching grants and revocation control RLS',async()=>{
    assert.equal((await db.query('select home_branch_id from staff where id=$1',[staff])).rows[0].home_branch_id,branch)
    await db.query('select set_staff_branch_access($1,$2,true,$3::uuid[])',[staff,branch,[branch2]])
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[staff]);await db.exec('set local role authenticated')
    assert.equal((await db.query('select count(*)::int n from branches where id=$1',[branch2])).rows[0].n,1)
    await db.exec('savepoint manager_grant');await assert.rejects(db.query('select set_staff_branch_access($1,$2,true,$3::uuid[])',[staff,branch,[branch2]]),/Owner access/);await db.exec('rollback to savepoint manager_grant')
    await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,true)",[owner]);await db.query('select set_staff_branch_access($1,$2,false,$3::uuid[])',[staff,branch,[]])
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[staff]);await db.exec('set local role authenticated');assert.equal((await db.query('select count(*)::int n from branches where id=$1',[branch2])).rows[0].n,0);await db.exec('reset role')
  })
  await isolated('pickup payment and stock transition succeed as one transaction',async()=>{
    const f=await fixture({total:100,status:'confirmed'});await command(f.booking,{status:'picked_up',payments:[{type:'balance',amount:100,method:'cash'}],pickupPhotos:[]},'pickup');assert.equal((await bookingState(f.booking)).status,'picked_up');assert.equal(Number((await bookingState(f.booking)).amount_paid),100)
  })
  await isolated('branch defaults change atomically and invalid manager leaves the default intact',async()=>{
    const created=(await db.query('select save_branch(null,$1::jsonb) result',[JSON.stringify({name:'New branch',prefix:'NEW',is_default:true})])).rows[0].result
    assert.equal((await db.query('select count(*)::int n from branches where business_id=$1 and is_default',[biz])).rows[0].n,1)
    await db.exec('savepoint invalid_branch')
    await assert.rejects(db.query('select save_branch(null,$1::jsonb)',[JSON.stringify({name:'Invalid branch',prefix:'BAD',is_default:true,manager_id:randomUUID()})]))
    await db.exec('rollback to savepoint invalid_branch')
    assert.equal((await db.query('select id from branches where business_id=$1 and is_default',[biz])).rows[0].id,created.id)
  })
  await isolated('damaged returns record unavailability once while missing quantities remain issued',async()=>{
    const f=await fixture();await receive(f,1,'damaged-return',{unavailableQuantity:1,reason:'damaged'});await receive(f,1,'damaged-return',{unavailableQuantity:1,reason:'damaged'});
    assert.equal((await db.query('select sum(quantity)::int n from inventory_unavailability where booking_item_id=$1',[f.line])).rows[0].n,1)
    assert.equal((await bookingState(f.booking)).status,'partially_returned')
  })
  await isolated('reminders deduplicate and recipients lose access after revocation',async()=>{
    await db.query("insert into push_subscriptions(staff_id,business_id,endpoint,p256dh,auth_key) values ($1,$2,'https://fcm.googleapis.com/test','test','test')",[staff,biz]);const f=await fixture({status:'confirmed'});
    const time=(await db.query("select to_char(now() at time zone 'UTC'-interval '1 minute','HH24:MI') time")).rows[0].time
    await db.query('select save_push_settings($1,$2::jsonb)',[branch,JSON.stringify({enabled:true,events:{},reminders:[{event:'pickup_reminder',days_before:1,time}]})]);await db.query('select enqueue_push_reminders()');await db.query('select enqueue_push_reminders()');assert.equal((await db.query("select count(*)::int n from message_outbox where booking_id=$1 and payload->>'event'='pickup_reminder'",[f.booking])).rows[0].n,1)
    await db.query("update staff set permissions='{}' where id=$1",[staff]);assert.equal((await db.query("select push_recipient_allowed($1,$2,$3,'pickup_reminder') allowed",[staff,biz,branch])).rows[0].allowed,false)
  })
})
