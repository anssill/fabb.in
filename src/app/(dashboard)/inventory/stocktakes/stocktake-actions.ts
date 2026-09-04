'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startStocktake(formData: FormData) {
  const supabase = await createClient()
  const note = String(formData.get('note') || '').trim()
  const { data, error } = await (supabase.rpc as any)('start_stocktake', { p_note: note || null, p_blind_count: true })
  if (error) throw new Error(error.message)
  redirect(`/inventory/stocktakes/${data}`)
}

export async function saveCounts(stocktakeId: string, formData: FormData) {
  const supabase = await createClient()
  const counts = Object.fromEntries([...formData.entries()].filter(([key]) => key.startsWith('count:')).map(([key, value]) => [key.slice(6), String(value)]))
  const { error } = await (supabase.rpc as any)('record_stocktake_counts', { p_stocktake_id: stocktakeId, p_counts: counts })
  if (error) throw new Error(error.message)
  revalidatePath(`/inventory/stocktakes/${stocktakeId}`)
  revalidatePath('/inventory/stocktakes')
}

export async function approveStocktake(stocktakeId: string, formData: FormData) {
  const supabase = await createClient()
  const note = String(formData.get('note') || '').trim()
  const { error } = await (supabase.rpc as any)('approve_stocktake', { p_stocktake_id: stocktakeId, p_note: note || null })
  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
  redirect('/inventory/stocktakes')
}
