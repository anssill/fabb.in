import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {loadSource} from './helpers/load-source.mjs'
const {buildInvoice,invoiceSettings,whatsappPhone,invoiceMessage}=loadSource('src/lib/invoice.ts')
const {InvoiceDocument}=loadSource('src/components/invoices/InvoiceDocument.tsx')
const booking={booking_number:'CUSTOM/123',created_at:'2026-09-27',pickup_date:'2026-10-01',return_date:'2026-10-03',subtotal:2000,discount_amount:200,tax_amount:324,total_amount:2124,customer:[{name:'A & B <Customer>',phone:'+91 9876543210'}],booking_items:[{item_name:'Suit',size:'L',quantity:2,price:1000,discount_percent:10,rate_basis:'booking',rental_days:3}],booking_payments:[{type:'advance',method:'cash',amount:500},{type:'balance',method:'upi',amount:1000,reference_number:'UPI-1'},{type:'deposit',method:'cash',amount:500},{type:'refund',method:'cash',amount:100},{type:'advance',method:'cash',amount:999,is_voided:true}]}
test('invoice uses saved branch settings, actual tax and split payments',()=>{
 const i=buildInvoice(booking,{name:'Fabb',address:'Shop',city:'City'},[{settings:{invoice:{prefix:'BILL',gst_enabled:false,footer_text:'Saved footer',terms_text:'Full terms',show_bank_details:true,bank_name:'Bank',bank_account:'123',signature_line:false}}}])
 assert.equal(i.invoiceNumber,'BILL-CUSTOM/123');assert.equal(i.paid,1400);assert.equal(i.balance,724);assert.equal(i.deposit,500);assert.equal(i.tax,324);assert.equal(i.items[0].total,1800)
 const html=renderToStaticMarkup(React.createElement(InvoiceDocument,{invoice:i}))
 for(const text of ['Saved footer','Full terms','A/C:','UPI-1','Cash'.toLowerCase(),'GST','Rs.324']) assert.ok(html.includes(text),text)
 assert.ok(!html.includes('Authorised Signatory'));assert.ok(html.includes('A &amp; B &lt;Customer&gt;'));assert.ok(html.includes('width:302.36px'))
})
test('explicitly cleared fields and hidden options stay cleared on all invoices',()=>{
 const settings=invoiceSettings({footer_text:'',terms_text:'',show_logo:false,show_bank_details:false,signature_line:false})
 const i=buildInvoice(booking,{name:'Fabb',logo_url:'https://example.invalid/logo.png'},{settings:{invoice:settings}})
 const html=renderToStaticMarkup(React.createElement(InvoiceDocument,{invoice:i}))
 assert.equal(settings.footer_text,'');for(const text of ['Thank you','TERMS','BANK DETAILS','<img','Authorised Signatory']) assert.ok(!html.includes(text),text)
})
test('WhatsApp phone normalization does not add a second country code',()=>{
 assert.equal(whatsappPhone('98765 43210'),'919876543210');assert.equal(whatsappPhone('+91 9876543210'),'919876543210');assert.equal(whatsappPhone('00971 501234567'),'971501234567');assert.equal(whatsappPhone('bad'),'')
 const text=invoiceMessage(buildInvoice(booking,{name:'Fabb'},{}));assert.ok(text.includes('Paid: ₹1,400'));assert.ok(text.includes('Balance due: ₹724'))
})

test('reference receipt retains its headings, branch address and later payment accounting',()=>{
 const i=buildInvoice(booking,{name:'Fabb',address:'Head office',city:'HQ'},{address:'Booking branch',city:'Town'})
 const html=renderToStaticMarkup(React.createElement(InvoiceDocument,{invoice:i}))
 for(const label of ['BOOKING INVOICE','Bill No','CUSTOMER','RENTAL','Duration','ITEMS','Subtotal after discount','Advance Paid','Balance Payments','Rental Refunds','Balance Due','PAYMENTS']) assert.ok(html.includes(label),label)
 assert.ok(html.includes('Booking branch'));assert.ok(!html.includes('Head office'));assert.ok(html.includes('dashed #111'));assert.ok(!html.includes('<table'))
 assert.ok(html.includes('Thank you for choosing Fabb.'));assert.ok(html.includes('This is a computer-generated invoice.'));assert.equal(i.advance,500);assert.equal(i.balancePayments,1000);assert.equal(i.refunds,100);assert.equal(i.rentalDays,1)
})
