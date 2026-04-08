'use server'

import { createClient } from '@/lib/supabase/server'
import { NotionService } from '@/lib/notion'
import { revalidatePath } from 'next/cache'

export async function createItem(formData: any, variants: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  // Generate SKU if empty
  const sku = formData.sku || `${formData.category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  // 1. Create item in Supabase
  const { data: item, error: itemErr } = await supabase
    .from('items')
    .insert({
      business_id: staff.business_id,
      branch_id: staff.branch_id,
      name: formData.name,
      sku,
      category: formData.category,
      description: formData.description || null,
      daily_rate: formData.daily_rate,
      deposit_amount: formData.deposit_amount || null,
      condition: formData.condition,
      purchase_price: formData.purchase_price || null,
      is_active: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (itemErr) throw itemErr

  // 2. Create variants in Supabase
  const variantRows = variants.map((v) => ({
    item_id: item!.id,
    size: v.size,
    colour: v.colour || null,
    total_stock: v.total_stock,
    available_stock: v.total_stock,
    reserved_stock: 0,
    price_override: v.price_override,
    is_active: true,
  }))

  const { error: varErr } = await supabase.from('item_variants').insert(variantRows)
  if (varErr) throw varErr

  // 3. Sync to Notion
  let notionPageId = null
  try {
    const stockSummary = variants.map(v => `${v.size}: ${v.total_stock}`).join(', ')
    notionPageId = await NotionService.syncItem({
      sku,
      name: formData.name,
      category: formData.category,
      dailyRate: formData.daily_rate,
      condition: formData.condition,
      stockSummary,
    })

    if (notionPageId) {
      await supabase
        .from('items')
        .update({ notion_page_id: notionPageId })
        .eq('id', item.id)
    }
  } catch (notionErr) {
    console.error('Notion sync failed for item:', notionErr)
    // Non-blocking error
  }

  // 4. Audit log
  await supabase.from('audit_logs').insert({
    business_id: staff.business_id,
    staff_id: user.id,
    action: 'item.created',
    entity_type: 'item',
    entity_id: item!.id,
    new_values: { name: formData.name, sku, variants: variants.length, notion_sync: !!notionPageId },
  })

  revalidatePath('/inventory')
  return { id: item.id }
}

export async function updateItemStatus(itemId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('items')
    .update({ status })
    .eq('id', itemId)

  if (error) throw error

  revalidatePath('/inventory')
  return { success: true }
}
