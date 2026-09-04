'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTransfer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const destination = String(formData.get('destination_branch_id') || '')
  const variant = String(formData.get('item_variant_id') || '')
  const quantity = Number(formData.get('quantity'))
  const note = String(formData.get('note') || '').trim()
  const { error } = await (supabase.rpc as any)('create_inventory_transfer', {
    p_destination_branch_id: destination,
    p_item_variant_id: variant,
    p_quantity: quantity,
    p_note: note || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/inventory/transfers')
  revalidatePath('/inventory')
}

export async function advanceTransfer(transferId: string, action: string, formData?: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const received = formData?.get('received_quantity')
  const note = String(formData?.get('note') || '').trim()
  const { error } = await (supabase.rpc as any)('advance_inventory_transfer', {
    p_transfer_id: transferId,
    p_action: action,
    p_received_quantity: received == null || received === '' ? null : Number(received),
    p_note: note || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/inventory/transfers')
  revalidatePath('/inventory')
}
