'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createExpense(data: {
  description: string
  amount: number
  category: string
  expense_date: string
  item_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { error } = await supabase.from('expenses').insert({
    business_id: staff.business_id,
    branch_id: staff.branch_id,
    description: data.description,
    amount: data.amount,
    category: data.category,
    expense_date: data.expense_date,
    item_id: data.item_id || null,
    created_at: new Date().toISOString()
  })

  if (error) throw error

  revalidatePath('/expenses')
  revalidatePath('/analytics')
  revalidatePath('/dashboard')
  return { success: true }
}
