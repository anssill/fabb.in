'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient, type SupabaseClient } from '@supabase/supabase-js'

function getAdmin() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireActiveStaff(branchId?: string, businessId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = getAdmin()
  const { data: staff, error } = await admin
    .from('staff')
    .select('id, business_id, branch_id, status')
    .eq('id', user.id)
    .single()

  if (error || !staff || staff.status !== 'active') {
    throw new Error('Unauthorized staff')
  }

  if (businessId && staff.business_id !== businessId) {
    throw new Error('Business mismatch. Please refresh and try again.')
  }

  if (branchId && staff.branch_id !== branchId) {
    throw new Error('Branch mismatch. Please refresh and try again.')
  }

  return { admin, staff }
}

async function moveVariantOutOfAvailableStock(supabase: SupabaseClient, variantId?: string) {
  if (!variantId) return null

  const { data: variant, error: variantError } = await supabase
    .from('item_variants')
    .select('available_stock, reserved_stock, total_stock')
    .eq('id', variantId)
    .single()

  if (variantError) throw variantError
  if (!variant || Number(variant.available_stock) <= 0) {
    throw new Error('No available stock for this variant')
  }

  const nextAvailableStock = Number(variant.available_stock) - 1
  const { error: stockError } = await supabase
    .from('item_variants')
    .update({ available_stock: nextAvailableStock })
    .eq('id', variantId)
    .eq('available_stock', variant.available_stock)
    .select('id')
    .single()

  if (stockError) {
    throw new Error('Stock changed while sending this item to wash. Please try again.')
  }

  return variant
}

async function restoreVariantAvailableStock(
  supabase: SupabaseClient,
  variantId: string | undefined,
  previousVariant: { available_stock: number; total_stock: number } | null
) {
  if (!variantId || !previousVariant) return

  await supabase
    .from('item_variants')
    .update({ available_stock: previousVariant.available_stock })
    .eq('id', variantId)
    .lte('available_stock', previousVariant.total_stock)
}

export async function addToWashingQueue(data: {
  itemId: string
  variantId?: string
  priority: 'urgent' | 'normal' | 'low'
  notes?: string
  businessId: string
  branchId: string
  staffId: string
  stage?: 'in_washing' | 'in_fitting' | 'maintenance'
}) {
  const { admin: supabase, staff } = await requireActiveStaff(data.branchId, data.businessId)
  const stage = data.stage || 'in_washing'
  const previousVariant = await moveVariantOutOfAvailableStock(supabase, data.variantId)
  
  // 1. Insert into washing_queue
  const { data: queueEntry, error: queueError } = await supabase
    .from('washing_queue')
    .insert({
      business_id: data.businessId,
      branch_id: data.branchId,
      item_id: data.itemId,
      item_variant_id: data.variantId,
      priority: data.priority,
      notes: data.notes,
      added_by: staff.id,
      stage: stage
    })
    .select('id')
    .single()

  if (queueError) {
    await restoreVariantAvailableStock(supabase, data.variantId, previousVariant)
    throw queueError
  }

  // 2. Update item status
  // For inventory visibility, we map these lifecycle stages to item statuses
  const itemStatus = stage === 'maintenance' ? 'maintenance' : 'in_washing'
  const { error: itemError } = await supabase
    .from('items')
    .update({ status: itemStatus })
    .eq('id', data.itemId)

  if (itemError) {
    if (queueEntry?.id) {
      await supabase.from('washing_queue').delete().eq('id', queueEntry.id)
    }
    await restoreVariantAvailableStock(supabase, data.variantId, previousVariant)
    throw itemError
  }

  // 3. If priority is urgent, create a notification
  if (data.priority === 'urgent') {
    await supabase.from('notifications').insert({
      business_id: data.businessId,
      branch_id: data.branchId,
      type: 'washing_urgent',
      title: 'Urgent Wash Required',
      body: `Item ${data.itemId} requires urgent washing for an upcoming booking.`,
      action_url: '/washing'
    })
  }

  return { success: true }
}

export async function markAsReady(
  queueId: string, 
  itemId: string, 
  staffId: string, 
  branchId: string, 
  businessId: string,
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
) {
  const { admin: supabase, staff } = await requireActiveStaff(branchId, businessId)

  // 1. Fetch the variant ID from the queue first
  const { data: queueEntry, error: queueFetchError } = await supabase
    .from('washing_queue')
    .select('item_variant_id, branch_id, business_id, item_id')
    .eq('id', queueId)
    .eq('item_id', itemId)
    .eq('branch_id', branchId)
    .eq('business_id', businessId)
    .single()

  if (queueFetchError || !queueEntry) {
    throw new Error('Washing queue item not found. Please refresh and try again.')
  }

  // 1. Update washing_queue
  const { error: queueError } = await supabase
    .from('washing_queue')
    .update({
      stage: 'ready',
      condition_after: condition,
      completed_by: staff.id,
      completed_at: new Date().toISOString()
    })
    .eq('id', queueId)

  if (queueError) throw queueError

  // 2. Update item condition/status. The item only becomes available when no units remain in the cycle.
  const updatePayload: any = {}
  if (condition && condition !== 'damaged') {
    updatePayload.condition = condition
  }
  
  if (condition === 'damaged') {
    updatePayload.status = 'maintenance'
  }

  // 3. Increment available stock for the variant (if it's not damaged)
  if (queueEntry?.item_variant_id && condition !== 'damaged') {
    const { data: variant, error: variantError } = await supabase
      .from('item_variants')
      .select('available_stock, reserved_stock, total_stock')
      .eq('id', queueEntry.item_variant_id)
      .single()

    if (variantError) throw variantError

    const availableCapacity =
      Number(variant.total_stock) - Number(variant.available_stock) - Number(variant.reserved_stock)

    if (availableCapacity > 0) {
      const { error: stockErr } = await supabase.rpc('complete_washing', {
        p_variant_id: queueEntry.item_variant_id,
        p_quantity: 1
      })
      if (stockErr) throw stockErr
    }
  }

  const { count: activeQueueCount, error: activeQueueError } = await supabase
    .from('washing_queue')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', itemId)
    .neq('stage', 'ready')

  if (activeQueueError) throw activeQueueError
  if (condition !== 'damaged' && (activeQueueCount ?? 0) === 0) {
    updatePayload.status = 'available'
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: itemError } = await supabase
      .from('items')
      .update(updatePayload)
      .eq('id', itemId)
      .eq('branch_id', branchId)

    if (itemError) throw itemError
  }

  // 4. Create a notification for ready status
  await supabase.from('notifications').insert({
    business_id: businessId,
    branch_id: branchId,
    type: 'washing_ready',
    title: 'Item Ready from Wash',
    body: `Item ${itemId} is now ready and available for inventory.`,
    action_url: '/inventory'
  })

  return { success: true }
}


export async function updateQueueStage(
  queueId: string,
  itemId: string,
  newStage: 'in_washing' | 'in_fitting' | 'maintenance'
) {
  const { admin: supabase, staff } = await requireActiveStaff()

  const { data: queueEntry, error: queueFetchError } = await supabase
    .from('washing_queue')
    .select('id, item_id, branch_id, business_id')
    .eq('id', queueId)
    .eq('item_id', itemId)
    .single()

  if (queueFetchError || !queueEntry) {
    throw new Error('Washing queue item not found. Please refresh and try again.')
  }

  if (queueEntry.business_id !== staff.business_id || queueEntry.branch_id !== staff.branch_id) {
    throw new Error('Branch mismatch. Please refresh and try again.')
  }

  // 1. Update washing_queue
  const { error: queueError } = await supabase
    .from('washing_queue')
    .update({ stage: newStage })
    .eq('id', queueId)

  if (queueError) throw queueError

  // 2. Update item status (maintenance is special)
  const itemStatus = newStage === 'maintenance' ? 'maintenance' : 'in_washing'
  const { error: itemError } = await supabase
    .from('items')
    .update({ status: itemStatus })
    .eq('id', itemId)

  if (itemError) throw itemError

  return { success: true }
}
