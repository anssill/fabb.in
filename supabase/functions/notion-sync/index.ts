import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOTION_TOKEN = Deno.env.get('NOTION_TOKEN')!
const H = { 'Authorization':`Bearer ${NOTION_TOKEN}`, 'Content-Type':'application/json', 'Notion-Version':'2022-06-28' }

serve(async (req) => {
  const { type, booking_id, item_id } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  if (type === 'booking_created' || type === 'booking_updated') {
    const { data:b } = await supabase.from('bookings')
      .select('*, customer:customers(name,phone), branch:branches(name,settings)').eq('id',booking_id).single()
    const dbId = b.branch.settings.notion_bookings_db
    if (!dbId) return new Response(JSON.stringify({ skipped:true }))

    if (b.notion_page_id && type === 'booking_updated') {
      await fetch(`https://api.notion.com/v1/pages/${b.notion_page_id}`, {
        method:'PATCH', headers:H,
        body:JSON.stringify({ properties:{ 'Status':{ select:{ name:b.status } } } })
      })
    } else {
      const r = await fetch('https://api.notion.com/v1/pages', { method:'POST', headers:H, body:JSON.stringify({
        parent:{ database_id:dbId },
        properties:{
          'Booking ID':{ title:[{ text:{ content:b.booking_id_display } }] },
          'Customer':{ rich_text:[{ text:{ content:b.customer.name } }] },
          'Status':{ select:{ name:b.status } },
          'Pickup Date':{ date:{ start:b.pickup_date } },
          'Return Date':{ date:{ start:b.return_date } },
          'Total':{ number:b.total_amount },
          'Branch':{ rich_text:[{ text:{ content:b.branch.name } }] }
        }
      })})
      const page = await r.json()
      await supabase.from('bookings').update({ notion_page_id:page.id }).eq('id',booking_id)
    }
  }

  if (type === 'item_created' || type === 'item_status_changed') {
    const { data:item } = await supabase.from('items')
      .select('*, branch:branches(name,settings)').eq('id',item_id).single()
    const dbId = item.branch.settings.notion_inventory_db
    if (!dbId) return new Response(JSON.stringify({ skipped:true }))

    if (item.notion_page_id && type === 'item_status_changed') {
      await fetch(`https://api.notion.com/v1/pages/${item.notion_page_id}`, {
        method:'PATCH', headers:H,
        body:JSON.stringify({ properties:{ 'Status':{ select:{ name:item.status } } } })
      })
    } else {
      const r = await fetch('https://api.notion.com/v1/pages', { method:'POST', headers:H, body:JSON.stringify({
        parent:{ database_id:dbId },
        properties:{
          'Item Name':{ title:[{ text:{ content:item.name } }] },
          'SKU':{ rich_text:[{ text:{ content:item.sku||'' } }] },
          'Category':{ select:{ name:item.category } },
          'Status':{ select:{ name:item.status } },
          'Price':{ number:item.price },
          'Branch':{ rich_text:[{ text:{ content:item.branch.name } }] }
        }
      })})
      const page = await r.json()
      await supabase.from('items').update({ notion_page_id:page.id }).eq('id',item_id)
    }
  }

  if (type === 'monthly_expenses') {
    // Pull all expenses from last month, push to Notion Expenses DB
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth()-1)
    const start = new Date(lastMonth.getFullYear(),lastMonth.getMonth(),1).toISOString().split('T')[0]
    const end = new Date(lastMonth.getFullYear(),lastMonth.getMonth()+1,0).toISOString().split('T')[0]
    const { data:expenses } = await supabase.from('expenses').select('*, branch:branches(name,settings)').gte('date',start).lte('date',end)
    
    type GroupedAcc = Record<string, any[]>;
    const grouped = expenses?.reduce<GroupedAcc>((acc, e) => { 
        const key = e.branch.settings.notion_expenses_db; 
        if(key) { acc[key] = (acc[key] || []).concat(e); } 
        return acc; 
    }, {});
    
    for (const [dbId, items] of Object.entries(grouped || {})) {
      for (const e of items as any[]) {
        await fetch('https://api.notion.com/v1/pages', { method:'POST', headers:H, body:JSON.stringify({
          parent:{ database_id:dbId },
          properties:{
            'Date':{ title:[{ text:{ content:e.date } }] },
            'Category':{ select:{ name:e.category } },
            'Amount':{ number:e.amount },
            'Description':{ rich_text:[{ text:{ content:e.description||'' } }] }
          }
        })})
      }
    }
  }

  return new Response(JSON.stringify({ success:true }), { headers:{'Content-Type':'application/json'} })
})
