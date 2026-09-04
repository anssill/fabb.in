import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { isValidUuid } from '@/lib/api-utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { EditItemForm } from './EditItemForm'

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidUuid(id)) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) notFound()

  const { data: item } = await supabase
    .from('items')
    .select(`
      *,
      item_variants(id, size, total_stock, price_override, branch_id, archived_at)
    `)
    .eq('id', id)
    .eq('business_id', staff.business_id)
    .eq('item_variants.branch_id', staff.branch_id)
    .is('item_variants.archived_at', null)
    .single()

  if (!item) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/inventory/${id}`}><ChevronLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <h1 className="text-xl font-semibold text-slate-900">Edit Item</h1>
      </div>

      <EditItemForm item={item} />
    </div>
  )
}
