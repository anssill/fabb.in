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
}) {
  const supabase = createClient()
  
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
      stage: 'in_washing'
    })

  if (queueError) throw queueError

  // 2. Update item status to in_washing
  const { error: itemError } = await supabase
    .from('items')
    .update({ status: 'in_washing' })
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

export async function markAsReady(queueId: string, itemId: string, staffId: string, branchId: string, businessId: string) {
  const supabase = createClient()

  // 1. Update washing_queue
  const { error: queueError } = await supabase
    .from('washing_queue')
    .update({
      stage: 'ready',
      completed_by: staffId,
      completed_at: new Date().toISOString()
    })
    .eq('id', queueId)

  if (queueError) throw queueError

  // 2. Update item status back to available
  const { error: itemError } = await supabase
    .from('items')
    .update({ status: 'available' })
    .eq('id', itemId)

  if (itemError) throw itemError

  // 3. Create a notification for ready status
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
