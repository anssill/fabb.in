'use server'

import { createClient } from '@/lib/supabase/server'
import { NotionService } from '@/lib/notion'
import { revalidatePath } from 'next/cache'

function formatSupabaseError(error: any): Error {
  if (!error) return new Error('Unknown database error')
  return new Error(error.message || error.code || 'Database error')
}

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
      price: formData.price,
      deposit_amount: formData.deposit_amount ?? 0,
      condition: formData.condition,
      purchase_cost: formData.purchase_price || null,
      storage_location: formData.storage_location || null,
      cover_image_url: formData.cover_image_url || null,
      is_active: true,
      status: 'available',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (itemErr) throw formatSupabaseError(itemErr)

  // 2. Create variants in Supabase
  const variantRows = variants.map((v) => ({
    item_id: item!.id,
    size: v.size,
    colour: v.colour || null,
    total_stock: v.total_stock,
    available_stock: v.total_stock,
    reserved_stock: 0,
    price_override: v.price_override ?? null,
    status: 'available'
  }))

  const { error: varErr } = await supabase.from('item_variants').insert(variantRows)
  if (varErr) throw formatSupabaseError(varErr)

  // 3. Link image to `item_images` table
  if (formData.cover_image_url) {
    await supabase.from('item_images').insert({
      item_id: item.id,
      url: formData.cover_image_url,
      is_cover: true,
      display_order: 0,
      uploaded_by: user.id
    })
  }

  // 4. Sync to Notion
  let notionPageId = null
  try {
    const stockSummary = variants.map(v => `${v.size}: ${v.total_stock}`).join(', ')
    notionPageId = await NotionService.syncItem({
      sku,
      name: formData.name,
      category: formData.category,
      price: formData.price,
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
  await supabase.from('audit_log').insert({
    business_id: staff.business_id,
    staff_id: user.id,
    action: 'item.created',
    table_name: 'items',
    record_id: item!.id,
    new_value: { name: formData.name, sku, variants: variants.length, notion_sync: !!notionPageId },
  })

  revalidatePath('/inventory')
  return { id: item.id }
}

export async function updateItem(itemId: string, formData: any, variants: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  // 1. Update main item
  const { error: itemErr } = await supabase
    .from('items')
    .update({
      name: formData.name,
      category: formData.category,
      description: formData.description || null,
      price: formData.price,
      deposit_amount: formData.deposit_amount ?? 0,
      condition: formData.condition,
      purchase_cost: formData.purchase_price || null,
      storage_location: formData.storage_location || null,
      cover_image_url: formData.cover_image_url !== undefined ? formData.cover_image_url : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (itemErr) throw formatSupabaseError(itemErr)

  // 2. Reconciliation of variants
  // Get existing variants
  const { data: existingVariants } = await supabase
    .from('item_variants')
    .select('id')
    .eq('item_id', itemId)

  const existingIds = existingVariants?.map(v => v.id) || []
  const newIds = variants.map(v => v.id).filter(Boolean)

  // DELETE variants no longer present
  const toDelete = existingIds.filter(id => !newIds.includes(id))
  if (toDelete.length > 0) {
    await supabase.from('item_variants').delete().in('id', toDelete)
  }

  // UPSERT variants
  for (const v of variants) {
    const row = {
      item_id: itemId,
      size: v.size,
      colour: v.colour || null,
      total_stock: v.total_stock,
      available_stock: v.available_stock,
      reserved_stock: v.reserved_stock || 0,
      price_override: v.price_override ?? null,
    }

    if (v.id) {
      await supabase.from('item_variants').update(row).eq('id', v.id)
    } else {
      await supabase.from('item_variants').insert(row)
    }
  }

  // 3. Link image to `item_images` table
  if (formData.cover_image_url !== undefined) {
    if (formData.cover_image_url === null) {
      await supabase.from('item_images').delete().eq('item_id', itemId).eq('is_cover', true)
    } else {
      const { data: existingCover } = await supabase.from('item_images').select('id').eq('item_id', itemId).eq('is_cover', true).maybeSingle()
      if (existingCover) {
        await supabase.from('item_images').update({ url: formData.cover_image_url }).eq('id', existingCover.id)
      } else {
        await supabase.from('item_images').insert({
          item_id: itemId,
          url: formData.cover_image_url,
          is_cover: true,
          display_order: 0,
          uploaded_by: user.id
        })
      }
    }
  }

  // 4. Sync to Notion
  const { data: currentItem } = await supabase
    .from('items')
    .select('notion_page_id, sku')
    .eq('id', itemId)
    .single()

  const stockSummary = variants.map(v => `${v.size}: ${v.total_stock}`).join(', ')
  try {
    const notionPageId = await NotionService.syncItem({
      sku: currentItem?.sku || '',
      name: formData.name,
      category: formData.category,
      price: formData.price,
      condition: formData.condition,
      stockSummary,
    }, currentItem?.notion_page_id)

    if (notionPageId && notionPageId !== currentItem?.notion_page_id) {
      await supabase
        .from('items')
        .update({ notion_page_id: notionPageId })
        .eq('id', itemId)
    }
  } catch (notionErr) {
    console.error('Notion update failed:', notionErr)
  }

  // 4. Audit Log
  await supabase.from('audit_log').insert({
    business_id: staff.business_id,
    staff_id: user.id,
    action: 'item.updated',
    table_name: 'items',
    record_id: itemId,
    new_value: { name: formData.name, variants: variants.length },
  })

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${itemId}`)
  return { success: true }
}

export async function updateItemStatus(itemId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('items')
    .update({ status })
    .eq('id', itemId)

  if (error) throw formatSupabaseError(error)

  revalidatePath('/inventory')
  return { success: true }
}

export async function syncFullInventory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('business_id')
    .eq('id', user.id)
    .single()
  
  if (!staff) throw new Error('Staff record not found')

  // 1. Call the database reconstruction RPC
  const { error } = await supabase.rpc('sync_all_inventory_stock', {
    p_business_id: staff.business_id
  })

  if (error) throw formatSupabaseError(error)

  // 2. Add to audit log
  await supabase.from('audit_log').insert({
    business_id: staff.business_id,
    staff_id: user.id,
    action: 'inventory.fully_synced',
    table_name: 'businesses',
    record_id: staff.business_id,
    new_value: { timestamp: new Date().toISOString() }
  })

  revalidatePath('/inventory')
  revalidatePath('/bookings')
  return { success: true }
}
