'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function formatError(error: any): Error {
  return new Error(error?.message || error?.code || 'Database error')
}

export async function createExpense(data: {
  description: string
  amount: number
  category: string
  expense_date: string
  payment_method?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) throw new Error('Staff record not found')

  const { error } = await supabase.from('expenses').insert({
    business_id: staff.business_id,
    branch_id: staff.branch_id,
    added_by: user.id,
    staff_id: user.id,
    description: data.description,
    amount: data.amount,
    category: data.category,
    expense_date: data.expense_date,
    payment_method: data.payment_method || 'cash',
    notes: data.notes || null,
  })

  if (error) throw formatError(error)

  revalidatePath('/expenses')
  revalidatePath('/analytics')
  revalidatePath('/dashboard')
  return { success: true }
}
