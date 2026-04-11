import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { EditItemForm } from './EditItemForm'

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('items')
    .select(`
      *,
      item_variants(id, size, colour, total_stock, available_stock, reserved_stock, price_override)
    `)
    .eq('id', id)
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
