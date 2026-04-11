'use client'

import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  const supabase = createClient()
  const stage = data.stage || 'in_washing'
  
  // 1. Insert into washing_queue
  const { error: queueError } = await supabase
    .from('washing_queue')
    .insert({
      business_id: data.businessId,
      branch_id: data.branchId,
      item_id: data.itemId,
      item_variant_id: data.variantId,
      priority: data.priority,
      notes: data.notes,
      added_by: data.staffId,
      stage: stage
    })

  if (queueError) throw queueError

  // 2. Update item status
  // For inventory visibility, we map these lifecycle stages to item statuses
  const itemStatus = stage === 'maintenance' ? 'maintenance' : 'in_washing'
  const { error: itemError } = await supabase
    .from('items')
    .update({ status: itemStatus })
    .eq('id', data.itemId)

  if (itemError) throw itemError

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
  const supabase = createClient()

  // 1. Fetch the variant ID from the queue first
  const { data: queueEntry } = await supabase
    .from('washing_queue')
    .select('item_variant_id')
    .eq('id', queueId)
    .single()

  // 1. Update washing_queue
  const { error: queueError } = await supabase
    .from('washing_queue')
    .update({
      stage: 'ready',
      condition_after: condition,
      completed_by: staffId,
      completed_at: new Date().toISOString()
    })
    .eq('id', queueId)

  if (queueError) throw queueError

  // 2. Update item status back to available and update its condition
  const updatePayload: any = { status: 'available' }
  if (condition && condition !== 'damaged') {
    updatePayload.condition = condition
  }
  
  if (condition === 'damaged') {
      updatePayload.status = 'maintenance'
  }

  const { error: itemError } = await supabase
    .from('items')
    .update(updatePayload)
    .eq('id', itemId)

  if (itemError) throw itemError

  // 3. Increment available stock for the variant (if it's not damaged)
  if (queueEntry?.item_variant_id && condition !== 'damaged') {
    const { error: stockErr } = await supabase.rpc('complete_washing', {
      p_variant_id: queueEntry.item_variant_id,
      p_quantity: 1
    })
    if (stockErr) throw stockErr
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
  const supabase = createClient()

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

