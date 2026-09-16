import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const code=ts.transpileModule(fs.readFileSync('src/lib/booking-pricing.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
const loaded={exports:{}}; vm.compileFunction(code,['exports','module'])(loaded.exports,loaded)
const {calculateItemPricing:line,calculateBookingPricing:total}=loaded.exports

test('per-piece pricing covers the whole booking, with individual discounts',()=>{
 assert.deepEqual(total([{price:100,quantity:2,discount_percent:10},{price:250,quantity:1,discount_percent:20}]),{subtotal:450,discount_amount:70,total_amount:380})
})
test('legacy daily rates retain their stored billable days',()=>{
 assert.deepEqual(line({price:100,quantity:2,rental_days:3,discount_percent:10}),{subtotal:600,discount_amount:60,total_amount:540})
})
test('currency and percentage are rounded to paise before aggregation',()=>{
 assert.deepEqual(line({price:99.99,quantity:3,discount_percent:12.5}),{subtotal:299.97,discount_amount:37.5,total_amount:262.47})
 assert.equal(line({price:1.005,quantity:2}).subtotal,2.02)
})
test('zero price and full discount are valid',()=>{
 assert.equal(line({price:0,quantity:1}).total_amount,0)
 assert.equal(line({price:100,quantity:3,discount_percent:100}).total_amount,0)
})
test('invalid prices, quantities and discounts are rejected',()=>{
 for(const bad of [{price:-1},{price:NaN},{price:Infinity},{quantity:0},{quantity:1.5},{discount_percent:-1},{discount_percent:101},{discount_percent:NaN},{rental_days:0}]) assert.throws(()=>line({price:100,quantity:1,...bad}))
})

test('GST uses discounted booking price and stays disabled until configured',()=>{const base=total([{price:100,quantity:2,discount_percent:10}]);assert.equal(loaded.exports.applyBookingTax(base).total_amount,180);assert.equal(loaded.exports.applyBookingTax(base,{gst_enabled:true,gst_rate:18}).total_amount,212.4);assert.throws(()=>loaded.exports.applyBookingTax(base,{gst_enabled:true,gst_rate:-1}));})
