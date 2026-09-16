import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/load-source.mjs'
const { validPushEndpoint, reminderStillValid }=loadSource('src/lib/push/shared.ts')
test('push endpoints reject local, unencrypted and deceptive hosts',()=>{
 for(const url of ['http://fcm.googleapis.com/x','https://localhost/x','https://fcm.googleapis.com.evil.test/x','https://user@fcm.googleapis.com/x','https://127.0.0.1/x'])assert.equal(validPushEndpoint(url),false)
 for(const url of ['https://fcm.googleapis.com/x','https://web.push.apple.com/x','https://updates.push.services.mozilla.com/x'])assert.equal(validPushEndpoint(url),true)
})
test('changed dates, removed schedules and returned bookings cancel reminders',()=>{
 const rule={event:'return_reminder',days_before:1,time:'18:00'},booking={pickup_date:'2026-09-16',return_date:'2026-09-18',status:'picked_up'}
 const payload={event:rule.event,schedule:{rule,pickup_date:booking.pickup_date,return_date:booking.return_date}}
 assert.equal(reminderStillValid(payload,booking,{reminders:[rule]}),true)
 assert.equal(reminderStillValid(payload,{...booking,return_date:'2026-09-19'},{reminders:[rule]}),false)
 assert.equal(reminderStillValid(payload,{...booking,status:'closed'},{reminders:[rule]}),false)
 assert.equal(reminderStillValid(payload,booking,{reminders:[]}),false)
})
async function worker(options={}) {
 const calls=[],deliveries=[]
 const row={id:'event',recipient:'device',business_id:'business',branch_id:'branch',booking_id:'booking',attempt_count:1,payload:{event:'payment',title:'Untrusted title with private data'}}
 const db={rpc:async name=>({data:name==='claim_push_deliveries'?[row]:name==='push_recipient_allowed'?!options.revoked:null,error:null}),from(table){
  let update,operation='select'
  const query={select(){return query},eq(){return query},delete(){operation='delete';return query},update(value){operation='update';update=value;return query},then(resolve){calls.push({table,operation,update});return Promise.resolve({error:null}).then(resolve)},async maybeSingle(){return {error:null,data:table==='push_subscriptions'?{id:'device',staff_id:'staff',business_id:'business',endpoint:'https://fcm.googleapis.com/test',p256dh:'test',auth_key:'test'}:table==='branches'?{name:'Main',status:'active',settings:{}}:{id:'booking',status:'confirmed'}}}}
  return query
 }}
 const saved={secret:process.env.PUSH_WORKER_SECRET,publicKey:process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,privateKey:process.env.VAPID_PRIVATE_KEY}
 process.env.PUSH_WORKER_SECRET='test-secret';process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY='public';process.env.VAPID_PRIVATE_KEY='private'
 try {
  const {POST}=loadSource('src/app/api/notifications/push/worker/route.ts',{'@/lib/supabase/admin':{getSupabaseAdmin:()=>db},'web-push':{default:{sendNotification:async(_subscription,payload)=>{deliveries.push(JSON.parse(payload));if(options.expired)throw {statusCode:410};if(options.failure)throw {statusCode:503}}}}})
  const response=await POST(new Request('https://fabb.test/api/notifications/push/worker',{method:'POST',headers:{authorization:options.unauthorized?'Bearer wrong':'Bearer test-secret'}}))
  return {response,calls,deliveries}
 } finally { for(const [key,value] of [['PUSH_WORKER_SECRET',saved.secret],['NEXT_PUBLIC_VAPID_PUBLIC_KEY',saved.publicKey],['VAPID_PRIVATE_KEY',saved.privateKey]])if(value===undefined)delete process.env[key];else process.env[key]=value }
}
test('worker rejects unauthorized requests before sending',async()=>{const r=await worker({unauthorized:true});assert.equal(r.response.status,401);assert.equal(r.deliveries.length,0)})
test('revoked recipients never receive a push',async()=>{const r=await worker({revoked:true});assert.equal(r.deliveries.length,0);assert.ok(r.calls.some(c=>c.update?.attempt_count===5))})
test('push payload contains only fixed event and branch, never arbitrary outbox text',async()=>{const r=await worker();assert.equal(r.deliveries.length,1);assert.equal(r.deliveries[0].title,'Payment recorded');assert.equal(r.deliveries[0].body,'Main');assert.ok(r.calls.some(c=>c.update?.status==='sent'))})
test('expired subscriptions are removed and transient failures are retried',async()=>{const expired=await worker({expired:true});assert.ok(expired.calls.some(c=>c.table==='push_subscriptions'&&c.operation==='delete'));const transient=await worker({failure:true});assert.ok(transient.calls.some(c=>c.update?.status==='failed'&&c.update.next_attempt_at))})
