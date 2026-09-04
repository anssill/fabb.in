'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ItemForm = {
  name: string
  sku?: string
  category: string
  description?: string
  price: number
  deposit_amount?: number
  purchase_price?: number
  purchase_cost?: number
  storage_location?: string
  cover_image_url?: string | null
  tracking_mode?: 'quantity' | 'asset'
  designer?: string
  brand?: string
  occasion?: string
  fabric?: string
  replacement_value?: number
  is_bundle?: boolean
}

type VariantForm = { id?: string; size: string; total_stock: number; price_override?: number | null }

function databaseError(error: { message?: string; code?: string } | null): Error {
  return new Error(error?.message || error?.code || 'Database operation failed')
}

async function context() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id, role, permissions').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) throw new Error('Select an active branch first')
  const permissions = (staff.permissions || {}) as Record<string, boolean>
  if (!['owner', 'super_admin'].includes(staff.role) && permissions.manage_inventory !== true) throw new Error('Inventory permission required')
  return { db: supabase as any, user, staff }
}

export async function createItem(formData: ItemForm, variants: VariantForm[]) {
  const { db, user, staff } = await context()
  const sku = formData.sku || `${formData.category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
  const { data: item, error } = await db.from('items').insert({
    business_id: staff.business_id, branch_id: staff.branch_id, name: formData.name, sku,
    category: formData.category, description: formData.description || null, price: formData.price,
    deposit_amount: formData.deposit_amount ?? 0, purchase_cost: formData.purchase_price || null,
    storage_location: formData.storage_location || null, cover_image_url: formData.cover_image_url || null,
    tracking_mode: formData.tracking_mode ?? 'quantity', designer: formData.designer || null,
    brand: formData.brand || null, occasion: formData.occasion || null, fabric: formData.fabric || null,
    replacement_value: formData.replacement_value ?? 0, is_bundle: formData.is_bundle ?? false,
    is_active: true, status: 'available', created_by: user.id,
  }).select('id').single()
  if (error || !item) throw databaseError(error)

  const rows = variants.map((variant) => ({
    business_id: staff.business_id, branch_id: staff.branch_id, item_id: item.id,
    size: variant.size, total_stock: variant.total_stock, price_override: variant.price_override ?? null, status: 'available',
  }))
  const { data: createdVariants, error: variantError } = await db.from('item_variants').insert(rows).select('id, total_stock')
  if (variantError) throw databaseError(variantError)

  if (createdVariants?.length) {
    await db.from('inventory_movements').insert(createdVariants.map((variant: { id: string; total_stock: number }) => ({
      business_id: staff.business_id, branch_id: staff.branch_id, item_id: item.id,
      item_variant_id: variant.id, movement_type: 'opening', quantity_delta: variant.total_stock,
      quantity_before: 0, quantity_after: variant.total_stock, performed_by: user.id,
    })))
  }

  if (formData.cover_image_url) {
    await db.from('item_images').insert({ item_id: item.id, url: formData.cover_image_url, is_cover: true, display_order: 0, uploaded_by: user.id })
  }
  await db.from('audit_log').insert({
    business_id: staff.business_id, branch_id: staff.branch_id, staff_id: user.id,
    action: 'item.created', table_name: 'items', record_id: item.id,
    new_value: { name: formData.name, sku, tracking_mode: formData.tracking_mode ?? 'quantity', variants: variants.length },
  })
  revalidatePath('/inventory')
  return { id: item.id }
}

export async function updateItem(itemId: string, formData: ItemForm, variants: VariantForm[]) {
  const { db, user, staff } = await context()
  const { data: current } = await db.from('items').select('id, name, tracking_mode').eq('id', itemId).eq('business_id', staff.business_id).single()
  if (!current) throw new Error('Item not found')

  const { error } = await db.from('items').update({
    name: formData.name, category: formData.category, description: formData.description || null,
    price: formData.price, deposit_amount: formData.deposit_amount ?? 0,
    purchase_cost: formData.purchase_price ?? formData.purchase_cost ?? null, storage_location: formData.storage_location || null,
    cover_image_url: formData.cover_image_url, tracking_mode: formData.tracking_mode ?? 'quantity',
    designer: formData.designer || null, brand: formData.brand || null, occasion: formData.occasion || null,
    fabric: formData.fabric || null, replacement_value: formData.replacement_value ?? 0,
    is_bundle: formData.is_bundle ?? false, updated_at: new Date().toISOString(),
  }).eq('id', itemId).eq('business_id', staff.business_id)
  if (error) throw databaseError(error)

  const { data: existing = [] } = await db.from('item_variants').select('id, total_stock').eq('item_id', itemId).is('archived_at', null)
  const retained = new Set(variants.flatMap((variant) => variant.id ? [variant.id] : []))
  const removed = existing.filter((variant: { id: string }) => !retained.has(variant.id))
  if (removed.length) await db.from('item_variants').update({ archived_at: new Date().toISOString() }).in('id', removed.map((variant: { id: string }) => variant.id))

  for (const variant of variants) {
    if (variant.id) {
      const before = existing.find((row: { id: string }) => row.id === variant.id)?.total_stock ?? 0
      const { error: updateError } = await db.from('item_variants').update({ size: variant.size, total_stock: variant.total_stock, price_override: variant.price_override ?? null }).eq('id', variant.id)
      if (updateError) throw databaseError(updateError)
      if (before !== variant.total_stock) await db.from('inventory_movements').insert({
        business_id: staff.business_id, branch_id: staff.branch_id, item_id: itemId, item_variant_id: variant.id,
        movement_type: 'adjustment', quantity_delta: variant.total_stock - before,
        quantity_before: before, quantity_after: variant.total_stock, performed_by: user.id,
      })
    } else {
      const { data: created, error: insertError } = await db.from('item_variants').insert({
        business_id: staff.business_id, branch_id: staff.branch_id, item_id: itemId,
        size: variant.size, total_stock: variant.total_stock, price_override: variant.price_override ?? null, status: 'available',
      }).select('id').single()
      if (insertError || !created) throw databaseError(insertError)
      await db.from('inventory_movements').insert({
        business_id: staff.business_id, branch_id: staff.branch_id, item_id: itemId, item_variant_id: created.id,
        movement_type: 'opening', quantity_delta: variant.total_stock, quantity_before: 0,
        quantity_after: variant.total_stock, performed_by: user.id,
      })
    }
  }

  if (formData.cover_image_url !== undefined) {
    const { data: cover } = await db.from('item_images').select('id').eq('item_id', itemId).eq('is_cover', true).maybeSingle()
    if (!formData.cover_image_url && cover) await db.from('item_images').delete().eq('id', cover.id)
    if (formData.cover_image_url && cover) await db.from('item_images').update({ url: formData.cover_image_url }).eq('id', cover.id)
    if (formData.cover_image_url && !cover) await db.from('item_images').insert({ item_id: itemId, url: formData.cover_image_url, is_cover: true, display_order: 0, uploaded_by: user.id })
  }

  await db.from('audit_log').insert({ business_id: staff.business_id, branch_id: staff.branch_id, staff_id: user.id, action: 'item.updated', table_name: 'items', record_id: itemId, old_value: current, new_value: { name: formData.name, variants: variants.length } })
  revalidatePath('/inventory')
  revalidatePath(`/inventory/${itemId}`)
  return { success: true }
}

export async function archiveItem(itemId: string) {
  const { db, user, staff } = await context()
  const now = new Date().toISOString()
  const { error } = await db.from('items').update({ is_active: false, status: 'archived', archived_at: now, archived_by: user.id }).eq('id', itemId).eq('business_id', staff.business_id)
  if (error) throw databaseError(error)
  await db.from('audit_log').insert({ business_id: staff.business_id, branch_id: staff.branch_id, staff_id: user.id, action: 'item.archived', table_name: 'items', record_id: itemId })
  revalidatePath('/inventory')
  return { success: true }
}

export async function registerInventoryAsset(itemId: string, formData: FormData) {
  const { db, user, staff } = await context()
  const itemVariantId = String(formData.get('item_variant_id') || '')
  const assetCode = String(formData.get('asset_code') || '').trim().toUpperCase()
  if (!itemVariantId || !assetCode) throw new Error('Size and asset code are required')

  const { data: item } = await db.from('items').select('id, tracking_mode').eq('id', itemId).eq('business_id', staff.business_id).single()
  if (!item || item.tracking_mode !== 'asset') throw new Error('This product is not configured for asset tracking')
  const { data: variant } = await db.from('item_variants').select('id, total_stock').eq('id', itemVariantId).eq('item_id', itemId).eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).is('archived_at', null).single()
  if (!variant) throw new Error('Size is not available in the active branch')
  const { count } = await db.from('inventory_assets').select('id', { count: 'exact', head: true }).eq('item_variant_id', itemVariantId).is('archived_at', null)
  if ((count ?? 0) >= Number(variant.total_stock)) throw new Error('All physical units for this size already have asset tags')

  const acquiredOn = String(formData.get('acquired_on') || '') || null
  const costRaw = String(formData.get('acquisition_cost') || '')
  const storageLocation = String(formData.get('storage_location') || '').trim() || null
  const { data: asset, error } = await db.from('inventory_assets').insert({
    business_id: staff.business_id, branch_id: staff.branch_id, item_id: itemId,
    item_variant_id: itemVariantId, asset_code: assetCode, acquired_on: acquiredOn,
    acquisition_cost: costRaw ? Number(costRaw) : null, storage_location: storageLocation, status: 'available',
  }).select('id').single()
  if (error || !asset) throw databaseError(error)
  await db.from('audit_log').insert({ business_id: staff.business_id, branch_id: staff.branch_id, staff_id: user.id, action: 'inventory.asset_registered', table_name: 'inventory_assets', record_id: asset.id, new_value: { item_id: itemId, item_variant_id: itemVariantId, asset_code: assetCode } })
  revalidatePath(`/inventory/${itemId}`)
}

export async function archiveInventoryAsset(itemId: string, assetId: string) {
  const { db, user, staff } = await context()
  const { data: asset } = await db.from('inventory_assets').select('id, asset_code, status').eq('id', assetId).eq('item_id', itemId).eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).is('archived_at', null).single()
  if (!asset) throw new Error('Asset not found')
  if (['reserved', 'out', 'in_transit'].includes(asset.status)) throw new Error('Reserved, out or in-transit assets cannot be archived')
  const archivedAt = new Date().toISOString()
  const { error } = await db.from('inventory_assets').update({ status: 'archived', archived_at: archivedAt, updated_at: archivedAt }).eq('id', assetId)
  if (error) throw databaseError(error)
  await db.from('audit_log').insert({ business_id: staff.business_id, branch_id: staff.branch_id, staff_id: user.id, action: 'inventory.asset_archived', table_name: 'inventory_assets', record_id: assetId, old_value: asset, new_value: { status: 'archived', archived_at: archivedAt } })
  revalidatePath(`/inventory/${itemId}`)
}

export async function addBundleComponent(bundleItemId: string, formData: FormData) {
  const { db, user, staff } = await context()
  const componentVariantId = String(formData.get('component_variant_id') || '')
  const name = String(formData.get('name') || '').trim()
  const quantity = Number(formData.get('quantity') || 1)
  if (!componentVariantId || !name || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Component, name and a positive quantity are required')

  const { data: bundle } = await db.from('items').select('id, is_bundle').eq('id', bundleItemId).eq('business_id', staff.business_id).single()
  if (!bundle?.is_bundle) throw new Error('This product is not configured as a bundle')
  const { data: variant } = await db.from('item_variants').select('id, item_id').eq('id', componentVariantId).eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).is('archived_at', null).single()
  if (!variant || variant.item_id === bundleItemId) throw new Error('Choose another active product as the component')

  const { data: component, error } = await db.from('item_bundle_components').insert({ business_id: staff.business_id, bundle_item_id: bundleItemId, component_item_id: variant.item_id, component_variant_id: variant.id, name, quantity, required: formData.get('required') === 'on' }).select('id').single()
  if (error || !component) throw databaseError(error)
  await db.from('audit_log').insert({ business_id: staff.business_id, branch_id: staff.branch_id, staff_id: user.id, action: 'inventory.bundle_component_added', table_name: 'item_bundle_components', record_id: component.id, new_value: { bundle_item_id: bundleItemId, component_item_id: variant.item_id, component_variant_id: variant.id, quantity } })
  revalidatePath(`/inventory/${bundleItemId}`)
}

export async function removeBundleComponent(bundleItemId: string, componentId: string) {
  const { db, user, staff } = await context()
  const { data: component } = await db.from('item_bundle_components').select('*').eq('id', componentId).eq('bundle_item_id', bundleItemId).eq('business_id', staff.business_id).single()
  if (!component) throw new Error('Bundle component not found')
  const { error } = await db.from('item_bundle_components').delete().eq('id', componentId)
  if (error) throw databaseError(error)
  await db.from('audit_log').insert({ business_id: staff.business_id, branch_id: staff.branch_id, staff_id: user.id, action: 'inventory.bundle_component_removed', table_name: 'item_bundle_components', record_id: componentId, old_value: component })
  revalidatePath(`/inventory/${bundleItemId}`)
}

/** Compatibility action retained for old buttons; availability is derived and never synchronized. */
export async function syncFullInventory() {
  revalidatePath('/inventory')
  revalidatePath('/bookings')
  return { success: true }
}
