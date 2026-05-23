import { notFound } from 'next/navigation'
import { isValidUuid } from '@/lib/api-utils'
import { getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { EditItemForm } from './EditItemForm'

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidUuid(id)) {
    notFound()
  }

  const staff = await getCurrentStaffContext()
  const supabase = getSupabaseAdmin()

  const { data: item } = await supabase
    .from('items')
    .select(`
      *,
      item_variants(id, size, colour, total_stock, available_stock, reserved_stock, price_override)
    `)
    .eq('id', id)
    .eq('business_id', staff.business_id)
    .maybeSingle()

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
